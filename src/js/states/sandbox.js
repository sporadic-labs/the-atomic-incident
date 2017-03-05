/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

require("../plugins/AStar.js");

var utils = require("../helpers/utilities.js");
var lightUtils = require("../game-objects/lights/light-utilities.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var DebugDisplay = require("../game-objects/debug-display.js");
var Color = require("../helpers/Color.js");

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
    groups.chargingStations = game.add.group(groups.midground, 
        "charging-stations");
    groups.lights = game.add.group(groups.midground, "lights");
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
    global.plugins = (global.plugins !== undefined ) ? global.plugins : {}; 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin); 
    globals.plugins.astar = game.plugins.add(Phaser.Plugin.AStar); 
    globals.plugins.lighting = game.plugins.add(LightingPlugin, 
        groups.foreground, wallLayer); 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    this.lighting = globals.plugins.lighting;
    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "walls", "tiles_25");

    // // Hack: make tiles visible over top of lighting layer
    // var tiles = wallLayer.getTiles(0, 0, this.world.width, this.world.height);
    // tiles.forEach(function (t) {
    //     t.alpha = 0.6;
    // });
    // wallLayer.bringToTop();

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, game.width/2, game.height/2, 
        groups.foreground);
    this.camera.follow(player);
    globals.player = player;
    
    // this.playerLight = new CarriableLight(game, player.position.x + 25, 
    //     player.position.y, groups.lights, 300, 0xFFFFFFFF, 100);

    // Generate a circle light at the mouse
    // this.mouseLight = this.lighting.addLight(new Phaser.Point(400, 400),
    //     new Phaser.Circle(0, 0, 200), 0xFFFFFFFF);

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    globals.debugDisplay = new DebugDisplay(game, groups.foreground);
    
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    // Keep track of what wave the player is on using the globals object.
    var waveNum = 0;
    globals.waveNum = waveNum;

    // var SpawnerWave = require("../game-objects/waves/spawn-point-wave.js");
    // globals.spawnEnemies = new SpawnerWave(game);

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
    
    // Simple pause menu
    var textStyle = {font: "18px Arial", fill: "#9C9C9C"};
    var pauseText = this.game.add.text(this.game.width - 20, 
        this.game.height - 5, "Pause", textStyle);
    pauseText.fixedToCamera = true;
    pauseText.inputEnabled = true;
    pauseText.anchor.set(1, 1);
    pauseText.events.onInputDown.add(function () {
        game.paused = true;
        pauseText.text = "Play";
        function unpause() {
            game.paused = false;
            pauseText.text = "Pause";
            this.game.input.onDown.remove(unpause, this);
        }
        this.game.input.onDown.add(unpause, this);
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
    // this.mouseLight.position.setTo(
    //     this.input.mousePointer.x + this.camera.x,
    //     this.input.mousePointer.y + this.camera.y
    // );
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