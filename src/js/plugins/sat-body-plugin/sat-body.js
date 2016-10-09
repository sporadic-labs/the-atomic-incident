/**
 * TODO:
 * - Do we need to worry problems with coordinate systems not matching for 
 *   collisions? If so, overlap should happen with world coordinates.
 * - Do we need the option for a SAT body to be composed of multiple shapes, 
 *   e.g. a box plus a circle?
 * - Do we need there to be a possible offset between the sprite's anchor and 
 *   this SatBody? If so, we need to track that.
 * - Do we need to consider scale and pivot?
 */

module.exports = SatBody;

var utils = require("../../helpers/utilities.js");
var SAT = require("sat");

var BODY_TYPE = {
    CIRCLE: "circle",
    POLYGON: "polygon"
};

// Helper Object Factories
var vec = function (x, y) {
    return new SAT.Vector(x, y);
};
var box = function (pos, w, h) {
    return new SAT.Box(pos, w, h);
};
var circle = function (pos, r) {
    return new SAT.Circle(pos, r);
};
var polygon = function (pos, points) {
    return new SAT.Polygon(pos, points);
};

function SatBody(sprite) {
    this.game = sprite.game;
    this._sprite = sprite;
    this.disableDebug();

    // Schedule clean up when parent sprite owner is destroyed
    this._sprite.events.onDestroy.add(this.destroy.bind(this));
}

SatBody.prototype.initBox = function (width, height) {
    var s = this._sprite;
    var anchor = this._sprite.anchor;
    width = utils.default(width, s.width);
    height = utils.default(height, s.height);
    this._bodyType = BODY_TYPE.POLYGON;
    this._body = box(vec(s.x, s.y), width, height).toPolygon();
    this._body.translate(-anchor.x * width, -anchor.y * height);
};

SatBody.prototype.initCircle = function (r) {
    this._bodyType = BODY_TYPE.CIRCLE;
    var s = this._sprite;
    if (!r) r = s.width / 2;
    this._body = circle(vec(s.x, s.y), r);
};

SatBody.prototype.initPolygon = function (points) {
    // Untested
    // This function would be more convient if it took an array or parsed the 
    // arguments variable to construct the points
    this._bodyType = BODY_TYPE.POLYGON;
    var s = this._sprite;
    this._body = polygon(vec(s.x, s.y), points);
};

SatBody.prototype.getBody = function () {
    return this._body;
};

SatBody.prototype.getBodyType = function () {
    return this._bodyType;
};

SatBody.prototype.testOverlap = function (otherBody) {
    // Handy boolean shorthands
    var thisIsCircle = (this._bodyType === BODY_TYPE.CIRCLE);
    var otherIsCircle = (otherBody._bodyType === BODY_TYPE.CIRCLE);

    // Determine the appropriate collision body comparison
    if (thisIsCircle && otherIsCircle) {
        return SAT.testCircleCircle(this._body, otherBody._body);
    } else if (!thisIsCircle && otherIsCircle) {
        return SAT.testPolygonCircle(this._body, otherBody._body);
    } else if (thisIsCircle && !otherIsCircle) {
        return SAT.testPolygonCircle(otherBody._body, this._body);
    } else {
        return SAT.testPolygonPolygon(this._body, otherBody._body);
    }
};

SatBody.prototype.postUpdate = function () {
    // Update the position of the colliding body
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
        this._body.setAngle(this._sprite.rotation);
        // Rotation should probably be world rotation...or something?
    }

    if (this._isDebug) this._updateDebug();
};

SatBody.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.satBody.removeBody(this);
};

SatBody.prototype.setDebugColor = function (debugColor) {
    this._debugColor = debugColor;
};

SatBody.prototype.enableDebug = function (debugColor) {
    debugColor = (debugColor !== undefined) ? debugColor : 0x00FF00;
    this._isDebug = true;
    if (!this._debugGraphics) {
        // Only create debug graphics if it is needed, for performance reasons
        this._debugGraphics = this.game.add.graphics(0, 0);
        this._sprite.parent.add(this._debugGraphics);
    } 
    this._debugGraphics.visible = true;
    if (debugColor) this.setDebugColor(debugColor);
};

SatBody.prototype.disableDebug = function () {    
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
};

SatBody.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this._sprite.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, this._debugColor, 0.6);
    this._debugGraphics.beginFill(this._debugColor, 0.4);
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._debugGraphics.drawCircle(this._body.x, this._body.y, 
            2 * this._body.r);
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        this._debugGraphics.drawPolygon(this._body.calcPoints);
    }
    this._debugGraphics.endFill();
};