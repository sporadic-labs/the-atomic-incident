/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var hull = require("hull.js");

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
        opacity: 1
    }
    bitmap.fill(0, 0, 0, globals.lighting.opacity);

    // Calculate lighting walls
    var clusters = this.calculateClusters();
    this.lightWalls = this.calculateHulls(clusters);

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
        } else {
            globals.plugins.satBody.enableDebugAll();
        }
    }, this);
};

Sandbox.prototype.calculateClusters = function () {
    var tileMap = this.game.globals.tileMap;
    var clusters = [];
    for (var x = 0; x < tileMap.width; x++) {
        for (var y = 0; y < tileMap.height; y++) {
            var tile = getCollidingTile(x, y);
            if (tile && !findTileInClusters(tile)) {
                cluster = [];
                recursivelySearchNeighbors(x, y, cluster);
                clusters.push(cluster);
            }
        }
    }

    function getCollidingTile(x, y) {
        var tile = tileMap.getTile(x, y, "BlockingLayer");
        if (tile && tile.collides) return tile;
        else return null;
    }

    function recursivelySearchNeighbors(x, y, cluster) {
        var tile = getCollidingTile(x, y);
        if (tile && (cluster.indexOf(tile) === -1)) {
            // Add the current tile
            cluster.push(tile);
            // Search the neighbors   
            recursivelySearchNeighbors(x, y - 1, cluster);
            recursivelySearchNeighbors(x, y + 1, cluster);
            recursivelySearchNeighbors(x + 1, y, cluster);
            recursivelySearchNeighbors(x - 1, y, cluster);
        }
    }

    function findTileInClusters(tile) {
        for (var i = 0; i < clusters.length; i++) {
            cluster = clusters[i];
            for (var j = 0; j < cluster.length; j++) {
                if (tile === cluster[j]) return cluster;
            }
        }
        return null;
    }

    return clusters;
};

Sandbox.prototype.calculateHulls = function (clusters) {
    var polygons = [];
    for (var i = 0; i < clusters.length; i++) {
        var cluster = clusters[i];
        var tilePoints = [];
        for (var t = 0; t < cluster.length; t++) {
            var tile = cluster[t];
            tilePoints.push(
                [tile.left, tile.top],
                [tile.right, tile.top],                
                [tile.left, tile.bottom],                
                [tile.right, tile.bottom]
            );
        }
        var points = hull(tilePoints, 1);
        var lines = [];
        for (var p = 1; p < points.length; p++) {
            var line = new Phaser.Line(points[p-1][0], points[p-1][1], 
                points[p][0], points[p][1]);
            lines.push(line);
        }
        // Connect last point to first point
        lines.push(new Phaser.Line(points[points.length-1][0], 
            points[points.length-1][1], points[0][0], points[0][1]));
        polygons.push(lines);
    }
    return polygons;
};

Sandbox.prototype.update = function () {
    var deltaAngle = Math.PI / 360;
    var points = [];
    var globals = this.game.globals;
    
    var walls = this.getWallsOnScreen();
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

    // Calculate position and angle to each stage corner.  Use this angle
    // to find an intersection point, and add it to the list of points.
    // TODO(rex): This could probably be a loop...
    var stageTopRight = new Phaser.Point(this.camera.view.x + this.camera.view.width, this.camera.view.y);
    var angleTopRight = globals.player.position.angle(stageTopRight);
    var intersectTopRight = checkRayIntersection(this, angleTopRight);
    points.push(intersectTopRight);
    var stageTopLeft = new Phaser.Point(this.camera.view.x, this.camera.view.y);
    var angleTopLeft = globals.player.position.angle(stageTopLeft);
    var intersectTopLeft = checkRayIntersection(this, angleTopLeft);
    points.push(intersectTopLeft);
    var stageBottomRight = new Phaser.Point(this.camera.view.x + this.camera.view.width, this.camera.view.y + this.camera.view.height);
    var angleBottomRight = globals.player.position.angle(stageBottomRight);
    var intersectBottomRight = checkRayIntersection(this, angleBottomRight);
    points.push(intersectBottomRight);
    var stageBottomLeft = new Phaser.Point(this.camera.view.x, this.camera.view.y + this.camera.view.height);
    var angleBottomLeft = globals.player.position.angle(stageBottomLeft);
    var intersectBottomLeft = checkRayIntersection(this, angleBottomLeft);
    points.push(intersectBottomLeft);

    console.log(points[0]);
    points = this.sortPoints(points, globals.player.position);
    console.log(points[0]);

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

    this.sortPoints(points, playerPoint);

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

    // This just tells the engine it should update the texture cache
    bitmap.dirty = true;
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

    for (var i = 0; i < this.lightWalls.length; i++) {
        for (var j = 0; j < this.lightWalls[i].length; j++) {
            this.game.debug.geom(this.lightWalls[i][j]);
        }
    }
};