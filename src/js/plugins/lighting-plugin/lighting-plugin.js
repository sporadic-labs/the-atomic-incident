var calculateHullsFromTiles = require("./hull-from-tiles.js");
var Light = require("./light.js");

module.exports = Phaser.Plugin.Lighting = function (game, manager) {
    this.game = game;
    this.camera = this.game.camera;
    this.lights = [];
    this._debugEnabled = false;
    this._pluginManager = manager;
};

Phaser.Plugin.Lighting.prototype = Object.create(Phaser.Plugin.prototype);

Phaser.Plugin.Lighting.prototype.addLight = function (position, radius, color) {
    var light = new Light(this.game, this.parent, position, radius, color);
    this.lights.push(light);
    if (this._debugEnabled) light.enableDebug();
    return light;
};

Phaser.Plugin.Lighting.prototype.removeLight = function (light) {
    var i = this.lights.indexOf(light);
    if (i !== -1) this.lights.splice(i, 1);
};

Phaser.Plugin.Lighting.prototype.setOpacity = function (opacity) {
    this.shadowOpacity = opacity;
};

Phaser.Plugin.Lighting.prototype.enableDebug = function () {
    this._debugEnabled = true;
    this._rayBitmapImage.visible = true;
    for (var i = 0; i < this.lights.length; i++) {
        this.lights[i].enableDebug();
    }
    this._originalShadowOpacity = this.shadowOpacity;
    this.shadowOpacity = 0.8;
};

Phaser.Plugin.Lighting.prototype.disableDebug = function () {
    this._debugEnabled = false;
    this._rayBitmapImage.visible = false;
    for (var i = 0; i < this.lights.length; i++) {
        this.lights[i].disableDebug();
    }
    this.shadowOpacity = this._originalShadowOpacity;
};

Phaser.Plugin.Lighting.prototype.isPointInShadow = function (worldPoint) {
    var localPoint = this._convertWorldPointToLocal(worldPoint);
    localPoint.x = Math.round(localPoint.x);
    localPoint.y = Math.round(localPoint.y);
    if ((localPoint.x < 0) || (localPoint.x > this._bitmap.width) ||
        (localPoint.y < 0) || (localPoint.y > this._bitmap.height)) {
        // Returns true if outside of bitmap bounds...
        return true;
    }
    var color = this._bitmap.getPixel(localPoint.x, localPoint.y);
    if (color.r !== 0 || color.g !== 0 || color.b !== 0) return false;
    return true;
};

Phaser.Plugin.Lighting.prototype.destroy = function () {
    this._bitmap.destroy();
    this._image.destroy();
    this._rayBitmap.destroy();
    this._rayBitmapImage.destroy();
    Phaser.Plugin.prototype.destroy.apply(this, arguments);
};

Phaser.Plugin.Lighting.prototype.init = function (parent, tilemapLayer,
    shadowOpacity) {
    this.parent = parent; 
    this.shadowOpacity = (shadowOpacity !== undefined) ? shadowOpacity : 1;

    var game = this.game;
    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = game.add.bitmapData(game.width, game.height);
    bitmap.fill(0, 0, 0, this.shadowOpacity);
    var image = bitmap.addToWorld(0, 0);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    parent.addChild(image);

    this._bitmap = bitmap;
    this._image = image;
    this._lightWalls = calculateHullsFromTiles(tilemapLayer);

    this._rayBitmap = this.game.add.bitmapData(game.width, game.height);
    this._rayBitmapImage = this._rayBitmap.addToWorld(game.width / 2, 
        game.height / 2, 0.5, 0.5, 1, 1);
    parent.addChild(this._rayBitmapImage);
    this._rayBitmapImage.fixedToCamera = true;
    this._rayBitmapImage.visible = false;
};

Phaser.Plugin.Lighting.prototype.render = function () {
    if (!this._debugEnabled) return;
    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            this.game.debug.geom(line, "rgba(255,0,255,0.75)");
        }
    }
};

Phaser.Plugin.Lighting.prototype.update = function () {
    var globals = this.game.globals;
    var walls = this._getVisibleWalls();

    // Clear and draw a shadow everywhere
    this._bitmap.blendSourceOver();
    this._bitmap.clear();
    this._bitmap.fill(0, 0, 0, this.shadowOpacity);
    this._bitmap.blendAdd();

    for (var i = 0; i < this.lights.length; i++) {
        var light = this.lights[i];
        light.update();
        var points = this._castLight(light, walls);
        this._drawLight(light, points);
    }

    // This just tells the engine it should update the texture cache
    this._bitmap.dirty = true;
    if (this._debugEnabled) this._rayBitmap.dirty = true;

    // Update the bitmap so that pixels are available
    this._bitmap.update();
};

Phaser.Plugin.Lighting.prototype._castLight = function (light, walls) {
    var points = [];

    for (var w = 0; w < walls.length; w++) {
        // Get start and end point for each wall.
        var wall = walls[w];
        var startAngle = light.position.angle(wall.start);
        var endAngle = light.position.angle(wall.end);

        // Check for an intersection at each angle, and +/- 0.001
        // Add the intersection to the points array.
        points.push(checkRayIntersection(this, startAngle-0.001));
        points.push(checkRayIntersection(this, startAngle));
        points.push(checkRayIntersection(this, startAngle+0.001));
        points.push(checkRayIntersection(this, endAngle-0.001));
        points.push(checkRayIntersection(this, endAngle));
        points.push(checkRayIntersection(this, endAngle+0.001));
    }

    // Hack for now: add additional samples to better approximate a circular 
    // radius of light
    var samples = 60;
    var delta = Phaser.Math.PI2 / samples;
    for (var a = 0; a < Phaser.Math.PI2; a += delta) {
        points.push(checkRayIntersection(this, a));
    }

    // Cast a ray starting at the light position through the specified angle.
    // Check if this ray intersets any walls. If it does, return the point at
    // which it intersects the closest wall. Otherwise, return the point at
    // which it intersects the edge of the stage.
    function checkRayIntersection(ctx, angle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(light.position.x, light.position.y,
            light.position.x + Math.cos(angle) * light.radius,
            light.position.y + Math.sin(angle) * light.radius);
        // Check if the ray intersected any walls
        var intersect = ctx._getWallIntersection(ray, walls);
        // Save the intersection or the end of the ray
        if (intersect) return intersect;
        else return ray.end;
    }

    this._sortPoints(points, light.position);
    return points;
};

Phaser.Plugin.Lighting.prototype._drawLight = function (light, points) {
    // Draw the "light" areas
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = Phaser.Color.getWebRGB(light.color);
    this._bitmap.ctx.strokeStyle = Phaser.Color.getWebRGB(light.color);

    // Convert the world positions of the light points to local coordinates 
    // within the bitmap
    var localPoints = points.map(this._convertWorldPointToLocal, this);
    this._bitmap.ctx.moveTo(localPoints[0].x, localPoints[0].y);
    for(var i = 0; i < localPoints.length; i++) {
        this._bitmap.ctx.lineTo(localPoints[i].x, localPoints[i].y);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();

    // Draw each of the rays on the rayBitmap
    if (this._debugEnabled) {
        this._rayBitmap.context.clearRect(0, 0, this.game.width, 
            this.game.height);
        this._rayBitmap.context.beginPath();
        this._rayBitmap.context.strokeStyle = "rgb(255, 0, 0)";
        this._rayBitmap.context.fillStyle = "rgb(255, 0, 0)";
        this._rayBitmap.context.moveTo(localPoints[0].x, localPoints[0].y);
        var lightPoint = this._convertWorldPointToLocal(light.position);
        for(var k = 0; k < localPoints.length; k++) {
            var p = localPoints[k];
            this._rayBitmap.context.moveTo(lightPoint.x, lightPoint.y);
            this._rayBitmap.context.lineTo(p.x, p.y);
            this._rayBitmap.context.fillRect(p.x - 2, p.y - 2, 4, 4);
        }
        this._rayBitmap.context.stroke();
    }
};

Phaser.Plugin.Lighting.prototype._getVisibleWalls = function () {
    var camRect = this.camera.view;
    var visibleWalls = [];

    // Create walls for each corner of the stage & add them to the walls array
    var x = camRect.x;
    var y = camRect.y;
    var w = camRect.width;
    var h = camRect.height;
    var camLeft = new Phaser.Line(x, y + h, x, y);
    var camTop = new Phaser.Line(x, y, x + w, y);
    var camRight = new Phaser.Line(x + w, y, x + w, y + h);
    var camBottom = new Phaser.Line(x + w, y + h, x, y + h);
    visibleWalls.push(camLeft, camRight, camTop, camBottom);

    for (var i = 0; i < this._lightWalls.length; i++) {
        for (var j = 0; j < this._lightWalls[i].length; j++) {
            var line = this._lightWalls[i][j];
            if (camRect.intersectsRaw(line.left, line.right, line.top, 
                line.bottom)) {
                line = getVisibleSegment(line);
                visibleWalls.push(line);
            }
        }
    }

    function getVisibleSegment(line) {
        // This function checks the given line against the edges of the camera. 
        // If it intersects with an edge, then we need to only get the visible
        // portion of the line.
        // TODO: if we want this to work for diagonal lines in the tilemap, we
        // need to update this code to account for the possibility that a line
        // can intersect multiple edges of the camera 
        var p = line.intersects(camLeft, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camRight, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.x < line.end.x) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        var p = line.intersects(camTop, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(p.x, p.y, line.end.x, line.end.y);
            } else {
                return new Phaser.Line(p.x, p.y, line.start.x, line.start.y);
            }
        }
        var p = line.intersects(camBottom, true);
        if (p) {
            // Find which point on the line is visible
            if (line.start.y < line.end.y) {
                return new Phaser.Line(line.start.x, line.start.y, p.x, p.y);
            } else {
                return new Phaser.Line(line.end.x, line.end.y, p.x, p.y);
            }
        }
        return line;
    }
    return visibleWalls;
};

Phaser.Plugin.Lighting.prototype._convertWorldPointToLocal = function (point) {
    // image.world is the position of the top left of the image (and hence the 
    // lighting bitmap) in world coordinates. To get from a world coordinate to
    // a coordinate relative to the bitmap's top left, just subract the 
    // image.world.
    return Phaser.Point.subtract(point, this._image.world);
};

Phaser.Plugin.Lighting.prototype._sortPoints = function (points, target) {
    // TODO: make more efficient by sorting and caching the angle calculations
    points.sort(function (p1, p2) {
        var angle1 = Phaser.Point.angle(target, p1);
        var angle2 = Phaser.Point.angle(target, p2);
        return angle1 - angle2;
    });
};

// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
Phaser.Plugin.Lighting.prototype._getWallIntersection = function(ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestIntersection = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestIntersection = intersect;
            }
        }
    }
    return closestIntersection;
};

// Return the closest wall that this ray intersects.
Phaser.Plugin.Lighting.prototype._getClosestWall = function(ray, walls) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestWall = null;

    for (var i = 0; i < walls.length; i++) {
        var intersect = Phaser.Line.intersects(ray, walls[i]);
        if (intersect) {
            // Find the closest intersection
            var distance = this.game.math.distance(ray.start.x, ray.start.y,
                intersect.x, intersect.y);
            if (distance < distanceToWall) {
                distanceToWall = distance;
                closestWall = walls[i];
            }
        }
    }
    return closestWall;
};
