/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var calculateHullsFromTiles = require("../helpers/hull-from-tiles.js")

function Sandbox() {}

Sandbox.prototype.create = function () {
    // Create the space for globals on the game object
    this.game.globals = {};

    // Shorthands
    var game = this.game;
    var globals = game.globals;
    
    // Debugging FPS
    game.time.advancedTiming = true;
    
    // Canvas styling
    game.canvas.style.cursor = "none";
    game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar)
    };

    // Groups for z-index sorting and for collisions
    var groups = {
        background: game.add.group(this.world, "background"),
        midground: game.add.group(this.world, "midground"),
        foreground: game.add.group(this.world, "foreground")
    };
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.pickups = game.add.group(groups.midground, "pickups");
    groups.nonCollidingGroup = game.add.group(groups.midground, 
        "non-colliding");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("colors", "coloredTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("Background", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var blockingLayer = map.createLayer("BlockingLayer", this.game.width, 
        this.game.height, groups.background);
    map.setCollisionBetween(0, 3, true, "BlockingLayer");
    globals.tileMap = map;
    globals.tileMapLayer = blockingLayer;

    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = this.game.add.bitmapData(game.width, game.height);
    var image = bitmap.addToWorld(game.width/2, game.height/2, 0.5, 0.5, 1, 1);
    groups.midground.addChild(image);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    image.fixedToCamera = true;
    globals.lighting = {
        bitmap: bitmap,
        image: image,
        opacity: 0.8
    }
    bitmap.fill(0, 0, 0, globals.lighting.opacity);

    // Calculate lighting walls
    this.lightWalls = calculateHullsFromTiles(map);

    // Create a bitmap for drawing rays
    this.rayBitmap = this.game.add.bitmapData(game.width, game.height);
    this.rayBitmapImage = this.rayBitmap.addToWorld(game.width/2, game.height/2, 0.5, 0.5, 1, 1);
    groups.midground.addChild(this.rayBitmapImage);
    this.rayBitmapImage.fixedToCamera = true;
    this.rayBitmapImage.visible = false;

    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "BlockingLayer", "colors");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    var px = 0;
    var py = 0;
    if (map.objects["player"]) {
        var objects = map.objects["player"];
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].name === "player") {
                px = objects[i].x;
                py = objects[i].y;
            }
        }
    }
    var player = new Player(game, px, py, groups.midground);
    this.camera.follow(player);
    globals.player = player;
    
    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    // var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
    // for (var i=0; i<50; i++) {
    //     new WeaponPickup(this.game, this.game.rnd.integerInRange(0, 1300), 
    //         this.game.rnd.integerInRange(0, 1300), "gun", 5)
    // }
    
    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
            this.rayBitmapImage.visible = false;
        } else {
            globals.plugins.satBody.enableDebugAll();
            this.rayBitmapImage.visible = true;
        }
    }, this);
};

Sandbox.prototype.getVisibleWalls = function () {
    var camRect = this.camera.view;
    var visibleWalls = [];

    // Create walls for each corner of the stage, and add them to the walls array.
    var camLeft = new Phaser.Line(camRect.x, camRect.y + camRect.height, camRect.x, camRect.y);
    var camTop = new Phaser.Line(camRect.x, camRect.y, camRect.x + camRect.width, camRect.y);
    var camRight = new Phaser.Line(camRect.x + camRect.width, camRect.y, camRect.x + camRect.width, camRect.y + camRect.height);
    var camBottom = new Phaser.Line(camRect.x + camRect.width, camRect.y + camRect.height, camRect.x, camRect.y + camRect.height);
    visibleWalls.push(camLeft, camRight, camTop, camBottom);

    for (var i = 0; i < this.lightWalls.length; i++) {
        for (var j = 0; j < this.lightWalls[i].length; j++) {
            var line = this.lightWalls[i][j];
            if (camRect.intersectsRaw(line.left, line.right, line.top, line.bottom)) {
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

Sandbox.prototype.update = function () {
    var deltaAngle = Math.PI / 360;
    var points = [];
    var globals = this.game.globals;

    var walls = this.getVisibleWalls();

    var playerPoint = globals.player.position;
    for (var w = 0; w < walls.length; w++) {
        // Get start and end point for each wall.
        var wall = walls[w];
        var startAngle = globals.player.position.angle(wall.start);
        var endAngle = globals.player.position.angle(wall.end);

        // Check for an intersection at each angle, and +/- 0.001
        // Add the intersection to the points array.
        points.push(checkRayIntersection(this, startAngle-0.001));
        points.push(checkRayIntersection(this, startAngle));
        points.push(checkRayIntersection(this, startAngle+0.001));
        points.push(checkRayIntersection(this, endAngle-0.001));
        points.push(checkRayIntersection(this, endAngle));
        points.push(checkRayIntersection(this, endAngle+0.001));
    }

    this.sortPoints(points, globals.player.position);

    // Create an arbitrarily long ray, starting at the player position, through the
    // specified angle.  Check if this ray intersets any walls.  If it does, return
    // the point at which it intersects the closest wall.  Otherwise, return the point
    // at which it intersects the edge of the stage.
    function checkRayIntersection(ctx, angle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var intersect = ctx.getWallIntersection(ray, walls);
        // Save the intersection or the end of the ray
        if (intersect) {
            return intersect;
        } else {
            return ray.end;
        }
    }
    // If the closest wall is the same as the one provided, return false.
    // Otherwise, return the new wall.
    function checkClosestWall(ctx, angle, closestWall) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(angle) * 1000,
            globals.player.y + Math.sin(angle) * 1000);
        // Check if the ray intersected any walls
        var newWall = ctx.getClosestWall(ray, walls);
        // Save the intersection or the end of the ray
        if (!newWall || !closestWall) { return false; }
        if (newWall.start.x <= closestWall.start.x + 3 &&
            newWall.start.x >= closestWall.start.x - 3 &&
            newWall.start.y <= closestWall.start.y + 3 &&
            newWall.start.y >= closestWall.start.y - 3 &&
            newWall.end.x <= closestWall.end.x + 3 &&
            newWall.end.x >= closestWall.end.x - 3 &&
            newWall.end.y <= closestWall.end.y + 3 &&
            newWall.end.y >= closestWall.end.y - 3) {
            return false;
        } else {
            return newWall;
        }
    }

    var bitmap = globals.lighting.bitmap;
    // Clear and draw a shadow everywhere
    bitmap.clear();
    bitmap.update();
    bitmap.fill(0, 0, 0, globals.lighting.opacity);
    // Draw the "light" areas
    bitmap.ctx.beginPath();
    bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    bitmap.ctx.strokeStyle = 'rgb(255, 255, 255)';
    // Note: xOffset and yOffset convert from world coordinates to coordinates 
    // inside of the bitmap mask. There might be a more elegant way to do this
    // when we optimize.
    // When the camera stops moving, fix the offset.
    var xOffset;
    if (globals.player.x > 400 && globals.player.x < 1400) {
        xOffset = globals.player.x - this.game.width / 2;
    } else if (globals.player.x > 1400) {
        xOffset = 1400 - this.game.width / 2;
    } else {
        xOffset = 0;
    }
    var yOffset;
    if (globals.player.y > 300 && globals.player.y < 1140) {
        yOffset = globals.player.y - this.game.height / 2;
    } else if (globals.player.y > 1140) {
        yOffset = 1140 - this.game.height / 2;;
    } else {
        yOffset = 0;
    }
    bitmap.ctx.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for(var i = 0; i < points.length; i++) {
        bitmap.ctx.lineTo(points[i].x - xOffset, points[i].y - yOffset);
    }
    bitmap.ctx.closePath();
    bitmap.ctx.fill();

    // Draw each of the rays on the rayBitmap
    this.rayBitmap.context.clearRect(0, 0, this.game.width, this.game.height);
    this.rayBitmap.context.beginPath();
    this.rayBitmap.context.strokeStyle = 'rgb(255, 0, 0)';
    this.rayBitmap.context.fillStyle = 'rgb(255, 0, 0)';
    this.rayBitmap.context.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    for(var k = 0; k < points.length; k++) {
        this.rayBitmap.context.moveTo(globals.player.x - xOffset, globals.player.y - yOffset);
        this.rayBitmap.context.lineTo(points[k].x - xOffset, points[k].y - yOffset);
        this.rayBitmap.context.fillRect(points[k].x - xOffset -2,
            points[k].y - yOffset - 2, 4, 4);
    }
    this.rayBitmap.context.stroke();

    // this.rayBitmap.context.beginPath();
    // this.rayBitmap.context.strokeStyle = 'rgb(0, 255, 0)';
    // this.rayBitmap.context.fillStyle = 'rgb(0, 255, 0)';
    // this.rayBitmap.context.moveTo(points[0].x - xOffset, points[0].y - yOffset);
    // for(var k = 0; k < points.length; k++) {
    //     this.rayBitmap.context.fillRect(points[k].x - xOffset -2,
    //         points[k].y - yOffset - 2, 4, 4);
    // }
    // this.rayBitmap.context.stroke();

    // This just tells the engine it should update the texture cache
    bitmap.dirty = true;
    this.rayBitmap.dirty = true;
};

Sandbox.prototype.sortPoints = function (points, target) {
    // TODO: make more efficient by sorting and caching the angle calculations
    points.sort(function (p1, p2) {
        var angle1 = Phaser.Point.angle(target, p1);
        var angle2 = Phaser.Point.angle(target, p2);
        return angle1 - angle2;
    });
};

Sandbox.prototype.getWallsOnScreen = function () {
    var player = this.game.globals.player;
    var layer = this.game.globals.tileMapLayer;
    var screenTileLeft = layer.getTileX(player.x - (this.game.width / 2));
    var screenTileRight = layer.getTileX(player.x + (this.game.width / 2));
    var screenTileTop = layer.getTileY(player.y - (this.game.height / 2));
    var screenTileBottom = layer.getTileY(player.y + (this.game.height / 2));

    // Constrain the left/right/top/bottom to be valid tile coords
    var tileMap = this.game.globals.tileMap;
    if (screenTileLeft < 0) screenTileLeft = 0;
    if (screenTileRight > tileMap.width) screenTileRight = tileMap.width;
    if (screenTileTop < 0) screenTileTop = 0;
    if (screenTileBottom > tileMap.height) screenTileBottom = tileMap.height; 

    var walls = [];
    tileMap.forEach(function(t) {
        if (t && t.collides) {
            walls.push(
                new Phaser.Line(t.left, t.top, t.right, t.top),
                new Phaser.Line(t.right, t.top, t.right, t.bottom),
                new Phaser.Line(t.left, t.bottom, t.right, t.bottom),
                new Phaser.Line(t.left, t.top, t.left, t.bottom)
            );
        }
    }, this, screenTileLeft, screenTileTop, 
    screenTileRight - screenTileLeft, screenTileBottom - screenTileTop, 
    "BlockingLayer");

    return walls;
};

// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
Sandbox.prototype.getWallIntersection = function(ray, walls) {
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
Sandbox.prototype.getClosestWall = function(ray, walls) {
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
                closestWall = walls[i]
            }
        }
    }
    return closestWall;
};


Sandbox.prototype.toggleRays = function() {
    // Toggle the visibility of the rays when the pointer is clicked
    if (this.rayBitmapImage.visible) {
        this.rayBitmapImage.visible = false;
    } else {
        this.rayBitmapImage.visible = true;
    }
};


Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, "#ff0000");

    // Draw only the visible walls from the tilemap polygons
    // var visisbleWalls = this.getVisibleWalls();
    // for (var i = 0; i < visisbleWalls.length; i++) {
    //     this.game.debug.geom(visisbleWalls[i]);
    // }

    for (var i = 0; i < this.lightWalls.length; i++) {
        for (var j = 0; j < this.lightWalls[i].length; j++) {
            var line = this.lightWalls[i][j];
            this.game.debug.geom(line, "rgba(255,0,255,0.75)");
        }
    }
};