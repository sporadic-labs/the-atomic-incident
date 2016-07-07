/**
 * TODO:
 * - Do we need to worry problems with coordinate systems not matching for 
 *   collisions? If so, overlap should happen with world coordinates.
 * - Do we need the option for a SAT body to be composed of multiple shapes, 
 *   e.g. a box plus a circle?
 * - Do we need there to be a possible offset between the sprite's anchor and 
 *   this SatBody? If so, we need to track that.
 */

module.exports = SatBody;

// Helper Factories
var Vec = function (x, y) {
    return new SAT.Vector(x, y);
};
var Box = function (pos, w, h) {
    return new SAT.Box(pos, w, h);
};
// var Circle = function (pos, r) {
//     return new SAT.Circle(pos, r);
// };
// var Poly = function (pos, points) {
//     return new SAT.Polygon(pos, points);
// };

function SatBody(sprite, isDebug) {
    this._sprite = sprite;
    this._game = sprite.game;

    // Debug graphics
    this._debugGraphics = this._game.add.graphics(0, 0);
    sprite.parent.add(this._debugGraphics);
    isDebug ? this.enableDebug(0x00FF00) : this.disableDebug();
}

SatBody.prototype.initBox = function (anchor) {
    var s = this._sprite;
    this._body = Box(Vec(s.x, s.y), s.width, s.height)
        .toPolygon();
    this._body.translate(-anchor.x * s.width, -anchor.y * s.height);
};

// NOT IMPLEMENTED YET
// SatBody.prototype.initCircle = function (x, y, r) {
//     this._body = new SAT.Circle(new SAT.V(x, y), r);
// };
// SatBody.prototype.initPolygon = function (x, y, points) {
//     this._body = new SAT.Polygon(new SAT.V(x, y), points);
// };

SatBody.prototype.getBody = function () {
    return this._body;
};

SatBody.prototype.testOverlap = function (otherBody) {
    return SAT.testPolygonPolygon(this._body, otherBody.getBody());   

    // NOT IMPLEMENTED YET
    // var isCircle = this._body instanceof SAT.Circle;
    // var otherIsCircle = otherBody instanceof SAT.Circle;
    // if (isCircle || otherIsCircle) {
    //     if (isCircle && otherIsCircle) return SAT.testCircleCircle(this._body, otherBody);
    //     else if (isCircle) return SAT.testCirclePolygon(this._body, otherBody);
    //     else return SAT.testPolygonCircle(this._body, otherBody);
    // } else {
    //     return SAT.testPolygonPolygon(this._body, otherBody);   
    // }
};

SatBody.prototype.update = function () {
    if (this._body instanceof SAT.Circle) {
        this._body.pos.x = this._sprite.x;
        this._body.pos.y = this._sprite.y;
    } else if (this._body instanceof SAT.Polygon) {
        // Fix for now - position is based on world, but something similar 
        // should probably be happening for the rotation
        this._body.pos.x = this._sprite.worldPosition.x;
        this._body.pos.y = this._sprite.worldPosition.y;
        this._body.setAngle(this._sprite.rotation);
    }

    if (this._isDebug) this._updateDebug();
};

SatBody.prototype.destroy = function () {
    this._debugGraphics.destroy();
};

SatBody.prototype.setDebugColor = function (debugColor) {
    this._debugColor = debugColor;
};

SatBody.prototype.enableDebug = function (debugColor) {
    this._isDebug = this._debugGraphics.visible = true;    
    if (debugColor) this.setDebugColor(debugColor);
};

SatBody.prototype.disableDebug = function () {    
    this._isDebug = this._debugGraphics.visible = false;
};

SatBody.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this._sprite.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, this._debugColor, 0.6);
    this._debugGraphics.beginFill(this._debugColor, 0.4);
    this._debugGraphics.drawPolygon(this._body.calcPoints);
    this._debugGraphics.endFill();
};