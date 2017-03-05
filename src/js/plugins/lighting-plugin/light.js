module.exports = Light;

var Color = require("../../helpers/Color.js");

Light.instances = 0;

/**
 * Creates a Light object that is responsible for casting light against the 
 * walls from LightingPlugin
 * 
 * @param {Phaser.Game} game
 * @param {LightingPlugin} parent
 * @param {Phaser.Circle|Phaser.Polygon} shape
 * @param {Phaser.Color|hex} color
 */
function Light(game, parent, position, shape, color) {
    this.game = game;
    this.parent = parent;
    this.shape = shape;
    this.color = (color instanceof Color) ? color : new Color(color);
    this.enabled = true;
    this.needsRedraw = true;
    this._isDebug = false;
    this._debugGraphics = null;
    this.position = position.clone();
    this.rotation = 0;
    this.id = Light.instances++;

    this._lastRotation = this.rotation;
    this._lastPosition = position.clone();
    this._lastColor = this.color.clone();

    // Set position and create bitmap based on shape type
    if (shape instanceof Phaser.Circle) {
        // For a circlular light, the bitmap is set to be the size of the
        // circle. The light should then be drawn in the center of the bitmap.
        this._bitmap = game.add.bitmapData(shape.diameter, shape.diameter);
        this._boundingRadius = shape.radius;
    } else if (shape instanceof Phaser.Polygon) {
        // For a polygon light, the bitmap is set to be the size of bounding
        // circle around the polygon. That means that the polygon can rotate
        // without a point going beyond the bitmap. That also means that we need
        // to make sure the polygon's scale doesn't get increased anywhere!
        var points = shape.toNumberArray();
        // Cache the original shape for the purposes of rotating
        this._originalShape = shape.clone();
        this._originalPoints = [];
        this._boundingRadius = 0;
        var center = new Phaser.Point(0, 0); // Points are relative to (0, 0)
        // Convert the points to Phaser.Point and find the bounding radius
        for (var i = 0; i < points.length; i += 2) {
            var p = new Phaser.Point(points[i], points[i + 1]);
            this._originalPoints.push(p);
            var d = center.distance(p);
            if (d > this._boundingRadius) this._boundingRadius = d;
        }
        this._bitmap = game.add.bitmapData(
            2 * this._boundingRadius, 
            2 * this._boundingRadius
        );
        this._setRotation(0);
    }

    this.intersectingWalls = this._recalculateWalls();
}

Light.prototype.enableDebug = function () {
    this._isDebug = true;
    if (!this._debugGraphics) {
        // Only create debug graphics if it is needed, for performance reasons
        this._debugGraphics = this.game.add.graphics(0, 0);
        this.parent.add(this._debugGraphics);
    } 
    this._debugGraphics.visible = true;
};

Light.prototype.disableDebug = function () {    
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
};

Light.prototype._setRotation = function (angle) {
    this.rotation = angle;
    if (!(this.shape instanceof Phaser.Polygon)) return;
    this._points = [];
    for (var i = 0; i < this._originalPoints.length; i++) {
        var newPoint = this._originalPoints[i].clone().rotate(0, 0, angle);
        this._points.push(newPoint);
    }
    this.shape = new Phaser.Polygon(this._points);
};

Light.prototype.update = function () {
    // Check for changes that require a redraw
    if (this._lastRotation !== this.rotation) {
        this._setRotation(this.rotation);
        this._lastRotation = this.rotation;
        this.needsRedraw = true;
    }
    if (!this._lastPosition.equals(this.position)) {
        this._lastPosition.copyFrom(this.position);
        this.needsRedraw = true;
    }
    if (!this._lastColor.equals(this.color)) {
        this._lastColor = this.color.clone();
        this.needsRedraw = true;
    }

    if (this.needsRedraw) this.intersectingWalls = this._recalculateWalls();
    if (this._debugGraphics) this._updateDebug();
};

/**
 * Check if a given world point is in the light cast by this light object.
 *
 * @param {Phaser.Point} worldPosition World point to check
 * @returns {bool}
 */
Light.prototype.isPointInLight = function (worldPosition) {
    // Exit if light is disabled
    if (!this.enabled) return false;
    // Check if the position is within range of the light's shape
    var lightRelativePos = Phaser.Point.subtract(worldPosition, this.position);
    var inShape = this.shape.contains(lightRelativePos.x, lightRelativePos.y);
    if (!inShape) return false;
    
    // If position is in the shape, do the more detailed work of checking the 
    // appropriate pixel in the light's bitmap 
    var bitmapPos = this.getTopLeft();
    var bitmapRelativePos = Phaser.Point.subtract(worldPosition, bitmapPos);
    // Round to pixel position
    bitmapRelativePos.x = Math.round(bitmapRelativePos.x);
    bitmapRelativePos.y = Math.round(bitmapRelativePos.y);
    // If point is outside of light's bitmap, return false
    if ((bitmapRelativePos.x < 0) || (bitmapRelativePos.y < 0) ||
            (bitmapRelativePos.x > this._bitmap.width) ||
            (bitmapRelativePos.y > this._bitmap.height)) {
        return false;
    }
    var color = this._bitmap.getPixel(bitmapRelativePos.x, bitmapRelativePos.y);
    if (color.r !== 0 || color.g !== 0 || color.b !== 0) return true;
    return false;
};

/**
 * Get a ray that starts at the position of the light and terminates at the edge
 * of the light's shape.
 *
 * @param {float} angle Angle in radians to cast the light
 * @returns {Phaser.Line} Line representing the ray
 */
Light.prototype.getLightRay = function (angle) {
    var ray = new Phaser.Line(this.position.x, this.position.y, 0, 0);
    if (this.shape instanceof Phaser.Circle) {
        ray.end.setTo(
            this.position.x + Math.cos(angle) * this.shape.radius,
            this.position.y + Math.sin(angle) * this.shape.radius
        );
        return ray;
    } else if (this.shape instanceof Phaser.Polygon) {
        // Hacky for now: cast the ray beyond the polygon's shape. See logic
        // from old rectangle shape code in this commit: 
        //  e7063dc40a5afe5fef0167a7f14ed30d4ccbf45a
        ray.end.setTo(
            this.position.x + Math.cos(angle) * this._boundingRadius,
            this.position.y + Math.sin(angle) * this._boundingRadius
        );
        return ray;
    }
};

Light.prototype.redraw = function (points) {
    // Light is expecting these points to be in world coordinates, since its own
    // position is in world coordinates
    if (this.needsRedraw) {
        // Clear offscreen buffer
        this.redrawLight();
        this.redrawShadow(points);      
        this.needsRedraw = false;
        this._bitmap.update(); // Update bitmap so that pixels can be queried
    }
};

Light.prototype.redrawLight = function () {
    // Draw the circular gradient for the light. This is the light without
    // factoring in shadows
    this._bitmap.cls();
    this._bitmap.blendSourceOver(); // Default blend mode

    var c = this.color.clone();
    var c1 = c.getWebColor();
    c.a *= 0.6;
    var c2 = c.getWebColor();
    c.a *= 0.3;
    var c3 = c.getWebColor();

    var shape = this.shape;
    if (shape instanceof Phaser.Circle) {
        // Draw the circle in the center of the bitmap
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 1, c3);
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 0.6, c2);
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 0.4, c1);
    } else if (shape instanceof Phaser.Polygon) {
        // Draw the polygon using the underlying bitmap. The points are relative
        // to the center of the bitmap (light.position is the center of the
        // bitmap). The center of the bitmap is at the location
        // (boundingRadius, boundingRadius), so shift each point by the radius
        this._bitmap.ctx.fillStyle = c1;
        this._bitmap.ctx.beginPath();
        this._bitmap.ctx.moveTo(this._boundingRadius + this._points[0].x, 
            this._boundingRadius + this._points[0].y);
        for (var i = 1; i < this._points.length; i += 1) {
            this._bitmap.ctx.lineTo(
                this._boundingRadius + this._points[i].x, 
                this._boundingRadius + this._points[i].y);
        }
        this._bitmap.ctx.closePath();
        this._bitmap.ctx.fill();
    }
};

/**
 * Return the world coordinate of the top left corner of the bitmap.
 *
 * @returns {Phaser.Point} Top left of the bitmap
 */
Light.prototype.getTopLeft = function () {
    if (this.shape instanceof Phaser.Circle) {
        return new Phaser.Point(
            this.position.x - this.shape.radius,
            this.position.y - this.shape.radius
        );
    } else if (this.shape instanceof Phaser.Polygon) {
        // Polygon bitmap is set to be the size of the bounding circle. The
        // light's position is in the center of the bitmap, so to get from the
        // position to the top left, simply shift by the circle radius.
        return new Phaser.Point(
            this.position.x - this._boundingRadius,
            this.position.y - this._boundingRadius
        );
    }
};


Light.prototype.redrawShadow = function (points) {
    // Destination in blend mode - the next thing drawn acts as a mask for the
    // existing canvas content
    this._bitmap.blendDestinationIn();

    // Draw the "light rays"
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = "white";
    this._bitmap.ctx.strokeStyle = "white";

    // Figure out the offset needed to convert the world positions of the light
    // points to local coordinates within the bitmap
    var off = this.getTopLeft();
    this._bitmap.ctx.moveTo(points[0].x - off.x, points[0].y - off.y);
    for(var i = 0; i < points.length; i++) {
        this._bitmap.ctx.lineTo(points[i].x - off.x, points[i].y - off.y);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();
};

Light.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.lighting.removeLight(this);
};

Light.prototype._updateDebug = function () {
    // The debug canvas is draw at the light's current position, so all debug
    // shapes drawn need to be drawn at (0, 0) to match the light
    this._debugGraphics.position.copyFrom(this.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(5, 0xFF00FF, 0.6);
    this._debugGraphics.drawCircle(0, 0, 2);
    if (this.shape instanceof Phaser.Circle) {
        this._debugGraphics.drawCircle(0, 0, 2 * this.shape.radius);
    } else if (this.shape instanceof Phaser.Polygon) {
        var points = this._points.slice(0);
        points.push(points[0]);
        this._debugGraphics.drawPolygon(points);
    }
};

Light.prototype._recalculateWalls = function () {
    var walls = this.game.globals.plugins.lighting.getWalls();

    // Determine which walls have normals that face away from the light - these
    // are the walls that intersect light rights
    var intersectingWalls = [];
    for (var w = 0; w < walls.length; w++) {
        var wall = walls[w];
        
        // Ignore walls that are not within range of the light. MH: this is 
        // essentially checking whether two circles intersect. Circle 1 is the 
        // the light. Circle 2 is a circle that circumscribes the wall (e.g. 
        // placed at the midpoint, with a radius of half wall length). There are
        // more accurate circle vs line collision detection algorithms that we
        // could use if needed...
        var dist = wall.midpoint.distance(this.position);
        if (dist > (this._boundingRadius + (wall.length / 2))) continue;

        // Shift the light so that its origin is at the wall midpoint, then 
        // calculate the dot of the that and the normal. This way both vectors
        // have the same origin point.
        var relativePos = Phaser.Point.subtract(this.position, wall.midpoint);
        var dot = wall.normal.dot(relativePos);
        var isBackFacing = dot < 0; 

        // Add some information to the wall to indicate whether it is back
        // facing or not. Walls are passed around by reference, so each light
        // does not have its own unique copy. Thus, the information needs to be
        // stored under an id unique to the specific light.
        wall.backFacings = wall.backFacings || {};
        wall.backFacings[this.id] = isBackFacing; 
        
        intersectingWalls.push(wall);
    }
    
    return intersectingWalls;
};