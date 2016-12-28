/**
 * @module SatBody
 * 
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

var SAT = require("sat");

var BODY_TYPE = {
    BOX: "box",
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
    var b = this._sprite.body;
    this._lastBodySize = {w: b.width, h: b.height};
    this.disableDebug();

    // Schedule clean up when parent sprite owner is destroyed
    this._sprite.events.onDestroy.add(this.destroy.bind(this));
}

/**
 * Creates a SAT box for the sprite.
 * If there is an arcade body, it is used as reference for the sat body
 * position, width and height.  The SAT box has an offset to ensure
 * rotation works properly.
 * If there is no arcade body, the sprite is used as reference, and the
 * sprites anchor is used to calculate offset.
 * MH: will we ever need this to be more flexible and allow for a SAT box that
 * doesn't line up with an arcade body?
 * RT: melee weapons and the beam do not use arcade bodies.
 */
SatBody.prototype.initBox = function () {
    this._bodyType = BODY_TYPE.BOX;
    var b = this._sprite.body ? this._sprite.body : this._sprite;
    this._boxBody = box(vec(b.x, b.y), b.width, b.height);
    this._body = this._boxBody.toPolygon();
    // Update position of sat body differently based on 
    // whether there is an arcade body or not.
    if (this._sprite.body) {
        // SAT body is currently at arcade body position, which is anchored at
        // (0, 0). To ensure that rotation works, use SAT.js offset to shift the 
        // SAT points to the center before rotation is applied.
        this._body.setOffset(vec(-b.width / 2, -b.height / 2));
    } else {
        var anchor = this._sprite.anchor;
        this._body.translate(-anchor.x * b.width, -anchor.y * b.height);
    }
    // Arcade body is anchored at (0, 0). To ensure that rotation works, use
    // SAT.js offset to shift the SAT points to the center before rotation is
    // applied.
    this.setPivot(b.width / 2, b.height / 2);
    return this;
};

/**
 * Creates a SAT circle for the sprite.
 * If there is an arcade body, it is used as reference for the position and
 * radius of the SAT body.
 * If there is no arcade body, use the sprite as reference for position and
 * radius of the SAT body.
 * MH: will we ever need this to be more flexible and allow for a SAT box that
 * doesn't line up with an arcade body?
 * @returns {SatBody} Returns the SatBody for chaining
 */
SatBody.prototype.initCircle = function () {
    this._bodyType = BODY_TYPE.CIRCLE;
    var b = this._sprite.body ? this._sprite.body : this._sprite;
    var r = b.radius ? b.radius : b.width / 2;
    this._body = circle(vec(b.x, b.y), r);
    return this;
};

/**
 * Updates the radius for the SAT body. The (x, y) coordinates of the SAT body 
 * stay at the center of the arcade body.
 * @param {float} radius New radius to use for the SAT body
 * @returns {SatBody} Returns the SatBody for chaining
 */
SatBody.prototype.setCircleRadius = function (radius) {
    if (this._bodyType !== BODY_TYPE.CIRCLE) return;
    this._body.r = radius;
    return this;
};

/**
 * Sets the pivot for the SAT box or polygon body. This is the (x, y) offset
 * applied to the points in the SAT body before any rotation is applied. This
 * only applies to box and polygon bodies - circles are always centered. Note:
 * in the current implementation, the pivot is the same as the anchor.
 * @param {float} x x position of pivot in pixels
 * @param {float} y y position of pivot in pixels
 * @returns {SatBody} Returns the SatBody for chaining
 */
SatBody.prototype.setPivot = function (x, y) {
    this._body.setOffset(vec(-x, -y));
    return this;
};

// MH: Needs testing before being used!
SatBody.prototype.initPolygon = function (points) {
    console.warn("Untested polygon SAT body!");
    // This function would be more convient if it took an array or parsed the 
    // arguments variable to construct the points
    this._bodyType = BODY_TYPE.POLYGON;
    var s = this._sprite;
    this._body = polygon(vec(s.x, s.y), points);
    return this;
};

SatBody.prototype.getBody = function () {
    return this._body;
};

SatBody.prototype.getBodyType = function () {
    return this._bodyType;
};

SatBody.prototype.getAxisAlignedBounds = function () {
    var left = null, right = null, top = null, bottom = null;
    if (this._bodyType === BODY_TYPE.POLYGON || 
            this._bodyType === BODY_TYPE.BOX) {
        var points = this._body.calcPoints;
        for (var i = 0; i < points.length; i++) {
            var x = points[i].x + this._body.pos.x;
            var y = points[i].y + this._body.pos.y;
            if (left === undefined || x < left) left = x;
            if (right === undefined || x > right) right = x;
            if (top === undefined || y < top) top = y;
            if (bottom === undefined || y > bottom) bottom = y;
        }
    } else if (this._bodyType === BODY_TYPE.CIRCLE) {
        left = this._body.pos.x - this._body.r;
        right = this._body.pos.x + this._body.r;
        top = this._body.pos.y - this._body.r;
        bottom = this._body.pos.y + this._body.r;
    }
    // Return a rectangle representing the bounds
    return { 
        x: left,
        y: top,
        width: right - left,
        height: bottom - top
    };
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

SatBody.prototype.testOverlapVsRectangle = function (rect) {
    // Convert rectangle to a SAT body
    var satRect = box(vec(rect.x, rect.y), rect.width, rect.height).toPolygon();

    // Determine the appropriate collision body comparison
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        return SAT.testPolygonCircle(satRect, this._body);
    } else {
        return SAT.testPolygonPolygon(this._body, satRect);
    }
};

SatBody.prototype.collideVsRectangle = function (rect) {
    // Convert rectangle to a SAT body
    var satRect = box(vec(rect.x, rect.y), rect.width, rect.height).toPolygon();
    var response = new SAT.Response();
    
    // Determine the appropriate collision body comparison
    var isCollision;
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        isCollision = SAT.testPolygonCircle(satRect, this._body, response);
    } else {
        isCollision = SAT.testPolygonPolygon(this._body, satRect, response);
    }

    if (isCollision) return response;
    else return false;
};

SatBody.prototype.postUpdate = function () {
<<<<<<< HEAD
    // Update the position of the sat body differently based
    // on whether an arcade body exists or not.
    if (this._sprite.body) {
        // Update the body based on the latest arcade body physics
        this.updateFromArcadeBody();
    } else {
        // Update the body based on sprite position
        this.updateFromSprite();
    }
=======
    // Check the sprite's body to see if the scale has changed, and if so, 
    // update the SAT body to match
    var b = this._sprite.body;
    var newBodySize = {w: b.width, h: b.height};
    if (this._lastBodySize.w !== newBodySize.w ||
            this._lastBodySize.h !== newBodySize.h) {
        this._lastBodySize = newBodySize;
        if (this._bodyType === BODY_TYPE.BOX) this.initBox();
        else if (this._bodyType === BODY_TYPE.CIRCLE) this.initCircle();
        else this.initPolygon();
    }
    // Update the body based on the latest arcade body physics
    this.updateFromBody();
>>>>>>> 947c94fb042466c104ee1484c8771a9ae6e9a237
    // Render is going to be called next, so update the debug
    if (this._isDebug) this._updateDebug();
};

/**
 * Updates the SAT body position and rotation based on the arcade body. This is
 * called internally by the plugin manager *but* may also need to be called
 * manually. If the SAT body needs to be up-to-date inside of a sprite's update
 * function (e.g. for collisions), call this method. Unfortunately, there is no
 * hook in the Phaser lifecycle to call this method every time the arcade body
 * is updated (which happens in stage.preUpdate and in stage.postUpdate for
 * arcade physics).
 */
<<<<<<< HEAD
SatBody.prototype.updateFromArcadeBody = function () {
=======
SatBody.prototype.updateFromBody = function () {
>>>>>>> 947c94fb042466c104ee1484c8771a9ae6e9a237
    // Update the position of the SAT body using the arcade body. Arcade bodies
    // are positions are relative to the top left of the body. 
    var arcadeBody = this._sprite.body;
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        // The arcade body position for a circle is anchored at the top left, 
        // but SAT circles are anchored at the center, so shift the position.
        this._body.pos.x = arcadeBody.x + arcadeBody.width / 2;
        this._body.pos.y = arcadeBody.y + arcadeBody.height / 2;
    } else if (this._bodyType === BODY_TYPE.BOX) {
        // The arcade body position for a rectangle is anchored at the top left.
        // SAT boxes have their pivot (and anchor) defined by the SAT body's
        // offset property. This offset is applied in SAT.js to ensure rotation
        // happens around the right location. To place the SAT body, start with
        // the arcade body location and shift by the negative offset (because
        // SAT is going to apply the positive offset internally).
        this._body.pos.x = arcadeBody.x + (-this._body.offset.x);
        this._body.pos.y = arcadeBody.y + (-this._body.offset.y);
        this._body.setAngle(this._sprite.rotation); // MH: World rotation?
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        // MH: Not yet sure what needs to happen here
        this._body.pos.x = arcadeBody.x + (-this._body.offset.x);
        this._body.pos.y = arcadeBody.y + (-this._body.offset.y);
        this._body.setAngle(this._sprite.rotation); // MH: World rotation?
    }
};

/**
 * Updates the SAT body position and rotation, based on the shape of the
 * sat body and the position of the sprite.
 */
SatBody.prototype.updateFromSprite = function () {
    // Update the position of the colliding body
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
    } else if (this._bodyType === BODY_TYPE.BOX) {
        this._body.pos.x = this._sprite.world.x;
        this._body.pos.y = this._sprite.world.y;
        this._body.setAngle(this._sprite.rotation);
        // Rotation should probably be world rotation...or something?
    } else if (this._bodyType === BODY_TYPE.POLYGON) {
        // MH: Not yet sure what needs to happen here
        this._body.pos.x = arcadeBody.body.x;
        this._body.pos.y = arcadeBody.body.y;
        this._body.setAngle(this._sprite.rotation);
        // Rotation should probably be world rotation...or something?
    }

    if (this._isDebug) this._updateDebug();
};

SatBody.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.satBody.removeBody(this);
};

/**
 * @returns {SatBody} Returns the SatBody for chaining
 */
SatBody.prototype.setDebugColor = function (debugColor) {
    this._debugColor = debugColor;
    return this;
};

/**
 * @returns {SatBody} Returns the SatBody for chaining
 */
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
    return this;
};

/**
 * @returns {SatBody} Returns the SatBody for chaining
 */
SatBody.prototype.disableDebug = function () {    
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
    return this;
};

SatBody.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this._body.pos);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, this._debugColor, 0.6);
    this._debugGraphics.beginFill(this._debugColor, 0.4);
    if (this._bodyType === BODY_TYPE.CIRCLE) {
        this._debugGraphics.drawCircle(0, 0, 2 * this._body.r);
    } else if (this._bodyType === BODY_TYPE.POLYGON 
            || this._bodyType === BODY_TYPE.BOX) {
        // The calcPoints are the polygon's points with offset and rotation
        // applied but without the pos applied
        this._debugGraphics.drawPolygon(this._body.calcPoints);
    }
    this._debugGraphics.endFill();
};