/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

require("../plugins/AStar.js");

var utils = require("../helpers/utilities.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var DestructableLight = require("../game-objects/destructable-light.js");

function Sandbox() {}

Sandbox.prototype.create = function () {
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
    groups.lights = game.add.group(groups.foreground, "lights");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("tiles_25", "coloredTiles");
    var wallTileset = map.addTilesetImage("wall-tiles", "wallTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("bg", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var wallLayer = map.createLayer("walls", this.game.width, this.game.height, 
        groups.foreground);
    map.setCollisionBetween(wallTileset.firstgid, wallTileset.firstgid + 
        wallTileset.total, true, wallLayer);
    globals.tileMap = map;
    globals.tileMapLayer = wallLayer;

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar),
        lighting: game.plugins.add(LightingPlugin, groups.foreground, wallLayer)
    };
    this.lighting = globals.plugins.lighting;
    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "walls", "tiles_25");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Get the Spawn Point(s) for the player from the tile map.
    var playerStartPoint = this.getMapPoints("player")[0]; // temp fix
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, playerStartPoint.x, playerStartPoint.y, 
        groups.midground);
    this.camera.follow(player);
    globals.player = player;

    // Create lights
    var lights = utils.default(map.objects["lights"], []); // Default to empty
    lights.forEach(function (light) {
        var x, y, radius;
        var p = light.properties || {};
        if (light.ellipse) {
            // Newer format for lights - using ellipses in Tiled
            x = light.x + (light.width / 2);
            y = light.y + (light.height / 2);
            radius = light.width / 2;
        } else {
            // Fallback to support old format using tiles
            x = light.x + map.tileWidth / 2;
            y = light.y - map.tileHeight / 2;
            radius = p.radius ? Number(p.radius) : 300;
        }
        var color = p.color ? utils.tiledColorToRgb(p.color) : 0xFFFFFFFF;
        var health = p.health ? Number(p.health) : 100;
        new DestructableLight(game, x, y, groups.lights, radius, color, 
            health);
    }, this);

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    var SpawnerWave = require("../game-objects/waves/spawn-point-wave.js");
    globals.spawnEnemies = new SpawnerWave(game);

    var SpawnPickups = require("../game-objects/pickups/spawn-pickups.js");
    globals.spawnPickups = new SpawnPickups(game);


    // Menu for switching tile maps
    var menu = [];
    var x = game.width - 36;
    for (var i = 0; i < globals.tilemapFiles.length; i++) {
        // The callback needs a reference to the value of i on each iteration,
        // so create a callback with binding
        var cb = game.state.start.bind(game.state, "load", true, true, 
            "resources/tilemaps/" + globals.tilemapFiles[i]);
        var b = game.add.button(x, (36 * i) + 4, "button", cb);
        b.fixedToCamera = true;
        menu.push(b);
    }
    this.menu = menu;

    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
            globals.plugins.lighting.disableDebug();
        } else {
            globals.plugins.satBody.enableDebugAll();
            globals.plugins.lighting.enableDebug();
        }
    }, this);
};

Sandbox.prototype.getMapPoints = function(key) {
    // There could be more than 1 map point per type...
    var mapPoints = [];
    // We are searching the current tile map layer.
    var map = this.game.globals.tileMap;
    // If the current key exists...
    if (map.objects[key]) {
        // For each object with the current key.
        var objects = map.objects[key];
        for (var i = 0; i < objects.length; i++) {
            mapPoints.push({
                x: objects[i].x,
                y: objects[i].y
            })
        }
    }
    return mapPoints;
};

Sandbox.prototype.update = function () {
    
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, 
    //  "#ff0000");
};

Sandbox.prototype.shutdown = function () {
    // Destroy all plugins (MH: should we be doing this or more selectively
    // removing plugins?)
    this.game.plugins.removeAll();
};