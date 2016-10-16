/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");

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

    // Create a bitmap and image that can be used for dynamic lighting
    var bitmap = this.game.add.bitmapData(game.width, game.height);
    var image = bitmap.addToWorld(game.width/2, game.height/2, 0.5, 0.5, 1, 1);
    image.blendMode = Phaser.blendModes.MULTIPLY;
    bitmap.fill(0, 0, 0, 1);
    bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    bitmap.ctx.strokeStyle = 'rgb(255, 255, 255)';
    bitmap.ctx.beginPath();
    bitmap.ctx.moveTo(game.width/2 + 0, game.height/2 + 0);
    bitmap.ctx.lineTo(game.width/2 + 100, game.height/2 + 0);
    bitmap.ctx.lineTo(game.width/2 + 100, game.height/2 + 100);
    bitmap.ctx.lineTo(game.width/2 + 0, game.height/2 + 100); 
    bitmap.ctx.closePath();
    bitmap.ctx.fill();
    globals.lighting = {
        bitmap: bitmap,
        image: image
    }

    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "BlockingLayer", "colors");

    globals.tileMap = map;
    globals.tileMapLayer = blockingLayer;

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    this.walls = this.getWallsFromTiles();
    console.log(this.walls);

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
    
    var Wave1 = require("../game-objects/waves/wave-1.js");
    new Wave1(game);

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

Sandbox.prototype.update = function () {
    var deltaAngle = Math.PI / 360;
    var points = [];
    var globals = this.game.globals;
    for(var a = 0; a < Math.PI * 2; a += deltaAngle) {
        // Create a ray from the light to a point on the circle
        var ray = new Phaser.Line(globals.player.x, globals.player.y,
            globals.player.x + Math.cos(a) * 1000, globals.player.y + Math.sin(a) * 1000);

        // Check if the ray intersected any walls
        var intersect = this.getWallIntersection(ray);

        // Save the intersection or the end of the ray
        if (intersect) {
            points.push(intersect);
        } else {
            points.push(ray.end);
        }
    }

    globals.lighting.bitmap.fill(0, 0, 0, 1);
    globals.lighting.bitmap.ctx.beginPath();
    globals.lighting.bitmap.ctx.fillStyle = 'rgb(255, 255, 255)';
    globals.lighting.bitmap.ctx.moveTo(points[0].x, points[0].y);
    for(var i = 0; i < points.length; i++) {
        globals.lighting.bitmap.ctx.lineTo(points[i].x, points[i].y);
    }
    globals.lighting.bitmap.ctx.closePath();
    globals.lighting.bitmap.ctx.fill();

    // This just tells the engine it should update the texture cache
    globals.lighting.bitmap.dirty = true;
};

// Dynamic lighting/Raycasting.
// Thanks, yafd!
// http://gamemechanicexplorer.com/#raycasting-2
Sandbox.prototype.getWallIntersection = function(ray) {
    var distanceToWall = Number.POSITIVE_INFINITY;
    var closestIntersection = null;

    for (var i = 0; i < this.walls.length; i++) {
        // Test each of the edges in this wall against the ray.
        // If the ray intersects any of the edges then the wall must be in the way.
        for(var i = 0; i < this.walls.length; i++) {
            var intersect = Phaser.Line.intersects(ray, this.walls[i]);
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
    }

    return closestIntersection;
};

// Build an array of all of the collidable walls
Sandbox.prototype.getWallsFromTiles = function() {
    var lines = [];

    // For each tile in the tileMap, 
    this.game.globals.tileMap.forEach(function(tile) {
        // If the tile can collide, create an array of lines that represent
        // the four edges of the tile.
        if (tile.collides) {
            // top
            lines.push(new Phaser.Line(tile.top, tile.left, tile.top, tile.right));
            // right
            lines.push(new Phaser.Line(tile.top, tile.right, tile.bottom,
                tile.right));
            // bottom
            lines.push(new Phaser.Line(tile.bottom, tile.left, tile.bottom,
                tile.right));
            // left
            lines.push(new Phaser.Line(tile.top, tile.left, tile.bottom,
                tile.left));
        }

    }, this, 0, 0, this.game.globals.tileMap.width, this.game.globals.tileMap.height, 1);

    return lines;
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, "#ff0000");
};