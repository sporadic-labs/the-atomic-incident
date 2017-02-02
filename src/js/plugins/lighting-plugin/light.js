module.exports = Light;


/**
 * Creates a Light object that is responsible for casting light against the 
 * walls from LightingPlugin
 * 
 * @param {Phaser.Game} game
 * @param {LightingPlugin} parent
 * @param {Phaser.Circle|Phaser.Rectangle|Phaser.Polygon} shape
 * @param {Phaser.Color|hex} color
 */
function Light(game, parent, position, shape, color) {
    this.game = game;
    this.parent = parent;
    this.shape = shape;
    this.color = (color !== undefined) ? color : 0xFFFFFFFF;
    this.enabled = true;
    this._isDebug = false;
    this._debugGraphics = null;
    this._needsRedraw = true;
    this.position = position.clone();
    this.rotation = 0;

    // Set position and create bitmap based on shape type
    if (shape instanceof Phaser.Circle) {
        this._bitmap = game.add.bitmapData(shape.diameter, shape.diameter);
        this._containingRadius = shape.radius;
    } else if (shape instanceof Phaser.Rectangle) {
        // Define bitmap to be the same size as the rectangle
        this._bitmap = game.add.bitmapData(shape.width, shape.height);
        // Define a circle that contains the rectangle
        this._containingRadius = Math.max(shape.width, shape.height);
        // Find angle of each vertex in the rectangle in order to do accurate 
        // light ray casting
        this.shape._vertexAngles = [
            // From 0 radians in order of increasing angle (counter-clockwise)
            {
                offset: new Phaser.Point(shape.width / 2, shape.height / 2), 
                angle: this.position.angle(shape.bottomRight)
            },
            {
                offset: new Phaser.Point(-shape.width / 2, shape.height / 2), 
                angle: this.position.angle(shape.bottomLeft)
            },
            {
                offset: new Phaser.Point(-shape.width / 2, -shape.height / 2), 
                angle: this.position.angle(shape.topLeft)
            },
            {
                offset: new Phaser.Point(shape.width / 2, -shape.height / 2), 
                angle: this.position.angle(shape.topRight)
            }
        ];
        // Angles come from Math.atan2, which is in the range [-PI, PI]. Unwrap
        // the angles so that they are in the range [0, 2 * PI]
        for (var i = 0; i < this.shape._vertexAngles.length; i++) {
            var a = this.shape._vertexAngles[i].angle;
            if (a < 0) {
                this.shape._vertexAngles[i].angle = Math.PI + (Math.PI + a); 
            }
        }
    } else if (shape instanceof Phaser.Polygon) {
        var points = shape.toNumberArray();
        // Find the bounding box around the polygon
        var minX = points[0];
        var maxX = points[0];
        var minY = points[1];
        var maxY = points[1];
        this._originalShape = shape.clone();
        this._originalPoints = [];
        for (var i = 0; i < points.length; i += 2) {
            var x = points[i];
            var y = points[i + 1];
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
            this._originalPoints.push(new Phaser.Point(x, y));
        }
        this._width = Math.abs(maxX - minX);
        this._height = Math.abs(maxY - minY);
        // Old method: fitting the bitmap to the polygon. For now, creating a 
        // bitmap that matches the screen size so that we can do rotations 
        // easily without doing complex coordinate transformations. TODO: 
        // optimize and shrink the bitmap to the smallest size needed
        this._bitmap = game.add.bitmapData(game.width, game.height);
        // Define a circle that contains the polygon
        this._containingRadius = Math.max(this._width, this._height);
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
    if (this._lastRotation !== this.rotation) {
        this._setRotation(this.rotation);
        this._lastRotation = this.rotation;
    }
    // For now, force redrawing and recalculating of the walls each frame
    this._needsRedraw = true;
    this.intersectingWalls = this._recalculateWalls();
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
    } else if (this.shape instanceof Phaser.Rectangle) {
        // The light ray will intersect the shape somewhere between two vertices
        // of the shape. Find those vertices and then do a linear interpolation
        // to find the point of intersection.
        var vertexAngles = this.shape._vertexAngles;
        var lastIndex = vertexAngles.length - 1;
        var twoPi = 2 * Math.PI;
        var percent, v1, v2;

        // Unwrap the angle to match the _vertexAngles stored
        if (angle < 0) angle += twoPi;

        // Angle is between last vertex and first vertex. This requires some
        // special logic since the angle for the first vertex is less than the
        // angle for the last vertex.
        var firstAngle = vertexAngles[0].angle;
        var lastAngle = vertexAngles[lastIndex].angle;
        if (angle <= firstAngle || angle >= lastAngle) {
            if (angle >= lastAngle) angle = angle - twoPi;
            var offset = twoPi - lastAngle;
            percent = ((firstAngle + offset) - (angle + offset)) /
                (firstAngle + offset);
            v1 = vertexAngles[0].offset;
            v2 = vertexAngles[lastIndex].offset;
            ray.end.setTo(
                this.position.x + v1.x * percent + v2.x * (1 - percent),
                this.position.y + v1.y * percent + v2.y * (1 - percent)
            );
            return ray;
        }

        // Angle is somewhere between the second vertex and the last vertex
        for (var i = 1; i < vertexAngles.length; i++) {
            if (angle <= vertexAngles[i].angle) {
                percent = (angle - vertexAngles[i - 1].angle) / 
                    (vertexAngles[i].angle - vertexAngles[i - 1].angle);
                v1 = vertexAngles[i].offset;
                v2 = vertexAngles[i - 1].offset;
                ray.end.setTo(
                    this.position.x + v1.x * percent + v2.x * (1 - percent),
                    this.position.y + v1.y * percent + v2.y * (1 - percent)
                );
                return ray;
            }
        }
    } else {
        // Hacky for now: cast the ray beyond the polygon's shape. Ideally, the
        // rectangle logic above would also apply here.
        ray.end.setTo(
            this.position.x + Math.cos(angle) * this._containingRadius,
            this.position.y + Math.sin(angle) * this._containingRadius
        );
        return ray;
    }
};

Light.prototype.redraw = function (points) {
    // Light is expecting these points to be in world coordinates, since its own
    // position is in world coordinates
    if (this._needsRedraw) {
        // Clear offscreen buffer
        this._bitmap.cls();
        this.redrawLight();
        this.redrawShadow(points);      
        this._needsRedraw = false;
        this._bitmap.update(); // Update bitmap so that pixels can be queried
    }
};

Light.prototype.redrawLight = function () {
    // Draw the circular gradient for the light. This is the light without
    // factoring in shadows
    this._bitmap.blendSourceOver(); // Default blend mode

    var c = Phaser.Color.getRGB(this.color);
    var c1 = Phaser.Color.getWebRGB(c);
    c.a *= 0.6;
    var c2 = Phaser.Color.getWebRGB(c);
    c.a *= 0.3;
    var c3 = Phaser.Color.getWebRGB(c);

    var shape = this.shape;
    if (shape instanceof Phaser.Circle) {
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 1, c3);
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 0.6, c2);
        this._bitmap.circle(shape.radius, shape.radius, shape.radius * 0.4, c1);
    } else if (shape instanceof Phaser.Rectangle) {
        // Don't use concentric rectangles since it looks silly 
        this._bitmap.rect(0, 0, shape.width, shape.height, c1);
    } else {
        // Draw the polygon using the underlying bitmap. The points must be
        // relative to bitmap itself. The bitmap is placed at the camera's top
        // left for now, so a point is located at:
        //      point[i] + light position - camera position
        var offset = Phaser.Point.subtract(this.position, this.game.camera);
        this._bitmap.ctx.fillStyle = c1;
        this._bitmap.ctx.beginPath();
        this._bitmap.ctx.moveTo(offset.x + this._points[0].x, 
            offset.y + this._points[0].y);
        for (var i = 1; i < this._points.length; i += 1) {
            this._bitmap.ctx.lineTo(
                offset.x + this._points[i].x, 
                offset.y + this._points[i].y);
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
    } else if (this.shape instanceof Phaser.Rectangle) {
        return new Phaser.Point(
            this.position.x - (this.shape.width / 2),
            this.position.y - (this.shape.height / 2)
        );
    } else {
        // Polygon bitmap is set to the screen size, so its top left should 
        // match the camera's location
        return this.game.camera.position.clone();
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
    } else if (this.shape instanceof Phaser.Rectangle) {
        this._debugGraphics.drawRect(
            -this.shape.width / 2, -this.shape.height / 2, 
            this.shape.width, this.shape.height
        );
    } else {
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
        if (dist > (this._containingRadius + (wall.length / 2))) continue;

        // Shift the light so that its origin is at the wall midpoint, then 
        // calculate the dot of the that and the normal. This way both vectors
        // have the same origin point.
        var relativePos = Phaser.Point.subtract(this.position, wall.midpoint);
        var dot = wall.normal.dot(relativePos);
        if (dot < 0) {
            // If the dot between the normal and the light point in negative,
            // the wall faces away from the light source
            intersectingWalls.push(wall);
        }
    }
    
    return intersectingWalls;
};