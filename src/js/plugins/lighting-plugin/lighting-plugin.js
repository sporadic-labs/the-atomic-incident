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

Phaser.Plugin.Lighting.prototype.addLight = function (shape, color) {
    var light = new Light(this.game, this.parent, shape, color);
    this.lights.push(light);
    if (this._debugEnabled) light.enableDebug();
    return light;
};

Phaser.Plugin.Lighting.prototype.removeLight = function (light) {
    var i = this.lights.indexOf(light);
    if (i !== -1) this.lights.splice(i, 1);
};

Phaser.Plugin.Lighting.prototype.getWalls = function () {
    return this._walls;
};

Phaser.Plugin.Lighting.prototype.setOpacity = function (opacity) {
    this.shadowOpacity = opacity;
};

Phaser.Plugin.Lighting.prototype.enableDebug = function () {
    this._debugEnabled = true;
    this._debugImage.visible = true;
    for (var i = 0; i < this.lights.length; i++) {
        this.lights[i].enableDebug();
    }
    // Hack: cycle through lights by enabling/disabling the debug mode
    if (this._debugLightIndex === undefined || 
            this._debugLightIndex >= this.lights.length - 1) {
        this._debugLightIndex = 0;
    } else {
        this._debugLightIndex++;
    }
    this._originalShadowOpacity = this.shadowOpacity;
    this.shadowOpacity = 0.8;
};

Phaser.Plugin.Lighting.prototype.disableDebug = function () {
    this._debugEnabled = false;
    this._debugImage.visible = false;
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
    this._debugBitmap.destroy();
    this._debugImage.destroy();
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
    this._tileSize = tilemapLayer.map.tileWidth;
    this._wallClusters = calculateHullsFromTiles(tilemapLayer);
    this._walls = [];
    for (var i = 0; i < this._wallClusters.length; i++) {
        for (var j = 0; j < this._wallClusters[i].length; j++) {
            this._walls.push(this._wallClusters[i][j]);
        }
    }

    this._debugBitmap = this.game.add.bitmapData(game.width, game.height);
    this._debugImage = this._debugBitmap.addToWorld(0, 0);
    parent.addChild(this._debugImage);
    this._debugImage.fixedToCamera = true;
    this._debugImage.visible = false;
};

Phaser.Plugin.Lighting.prototype.update = function () {    
    var walls = this._walls;
    // walls = walls.concat(this._getPlayerLines());

    // Clear and draw a shadow everywhere
    this._bitmap.blendSourceOver();
    this._bitmap.fill(0, 0, 0, this.shadowOpacity);

    if (this._debugEnabled) this._debugBitmap.clear();

    for (var i = 0; i < this.lights.length; i++) {
        var light = this.lights[i];
        if (!light.enabled) continue;
        light.update();
        var points = this._castLight(light);
        this._drawLight(light, points);

        // Draw the light rays - this gets pretty messy with multiple lights,
        // so only draw one of them
        if (this._debugEnabled && (i === this._debugLightIndex)) {
            var localPoints = points.map(this._convertWorldPointToLocal, this);
            var lightPoint = this._convertWorldPointToLocal(light.position);
            for(var k = 0; k < localPoints.length; k++) {
                var p = localPoints[k];
                this._debugBitmap.line(lightPoint.x, lightPoint.y, p.x, p.y,
                    "rgb(255, 255, 255)", 1);
                this._debugBitmap.circle(p.x, p.y, 2, "rgb(255, 255, 255)");
            }
        }
    }

    // Draw the wall normals
    if (this._debugEnabled) {
        for (var w = 0; w < walls.length; w++) {
            var mp = this._convertWorldPointToLocal(walls[w].midpoint);
            var norm = walls[w].normal.setMagnitude(10);          
            this._debugBitmap.line(mp.x , mp.y, mp.x + norm.x, mp.y + norm.y,
                "rgb(255, 255, 255)", 3);
        }
    }

    // This just tells the engine it should update the texture cache
    this._bitmap.dirty = true;
    if (this._debugEnabled) this._debugBitmap.dirty = true;

    // Update the bitmap so that pixels are available
    this._bitmap.update();
};

Phaser.Plugin.Lighting.prototype._castLight = function (light) {
    var points = [];
    var backWalls = light.intersectingWalls;

    // Only cast light at the walls that face away from the light. MH: this 
    // appears to work well when it comes to our current, single screen design.
    // We'll need to do some testing to see if this breaks moving lights and/or
    // maps larger than the screen.
    for (var w = 0; w < backWalls.length; w++) {
        // Get start and end point for each wall.
        var wall = backWalls[w];

        var startAngle = light.position.angle(wall.line.start);
        var endAngle = light.position.angle(wall.line.end);

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
        var ray = light.getLightRay(angle);
        // Check if the ray intersected any walls
        var intersect = ctx._getWallIntersection(ray, backWalls);
        // Save the intersection or the end of the ray
        if (intersect) return intersect;
        else return ray.end;
    }

    this._sortPoints(points, light.position);
    return points;
};

Phaser.Plugin.Lighting.prototype._drawLight = function (light, points) {
    light.redraw(points); // World coordinates
    var r = new Phaser.Rectangle(0, 0, light._bitmap.width, 
        light._bitmap.height);
    var p = this._convertWorldPointToLocal(light.getTopLeft());
    this._bitmap.copyRect(light._bitmap, r, p.x, p.y);
};

Phaser.Plugin.Lighting.prototype._getPlayerLines = function () {
    // Player "walls"
    var playerLines = [];
    var player = this.game.globals.player;
    var lastX = player.x + player.body.radius;
    var lastY = player.y;
    for (var a = 0; a <= Phaser.Math.PI2; a += Phaser.Math.PI2 / 10) {
        var x = player.x + Math.cos(a) * player.body.radius;
        var y = player.y + Math.sin(a) * player.body.radius;
        playerLines.push(new Phaser.Line(lastX, lastY, x, y));
        lastX = x;
        lastY = y;
    }
    return playerLines;
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
        var intersect = Phaser.Line.intersects(ray, walls[i].line);
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
