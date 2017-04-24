/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var DebugDisplay = require("../game-objects/debug-display.js");
const SoundEffectManager = require("../game-objects/sound-effect-manager.js");
const EffectsPlugin = 
    require("../plugins/camera-effects-plugin/camera-effects-plugin.js");
const LevelManager = require("../game-objects/level-manager.js");
const EasyStarPlugin = require("../plugins/EasyStarPlugin.js");

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
        foreground: game.add.group(this.world, "foreground"),
        lightingOverlay: game.add.group(this.world, "lighting-overlay"),
        hud: game.add.group(this.world, "hud"),
    };
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.nonCollidingGroup = game.add.group(groups.midground, 
        "non-colliding");
    groups.lights = game.add.group(groups.midground, "lights");
    groups.pickups = game.add.group(groups.foreground, "pickups");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Level manager
    const levelManager = new LevelManager(game, "arcade-map", "arcade-map-2");
    globals.levelManager = levelManager;

    // Temp: switch between levels with 1 & 2 keys
    var map1 = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    map1.onDown.add(() => levelManager.switchMap(0));
    var map2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
    map2.onDown.add(() => levelManager.switchMap(1));

    // Plugins
    global.plugins = (global.plugins !== undefined ) ? global.plugins : {}; 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin); 
    globals.plugins.effects = game.plugins.add(EffectsPlugin); 
    globals.plugins.lighting = game.plugins.add(LightingPlugin, groups.lightingOverlay); 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    this.lighting = globals.plugins.lighting;
    this.lighting.setOpacity(0.9);

    // Easystarjs plugin
    const easyStar = globals.plugins.easyStar = game.plugins.add(EasyStarPlugin);
    easyStar.setGrid(levelManager.getCurrentWallLayer(), [-1]);
    // Listen for level changes
    levelManager.levelChangeSignal.add(() => {
        globals.plugins.easyStar.setGrid(levelManager.getCurrentWallLayer(), [-1]);
    });

    // Sound manager
    globals.soundManager = new SoundEffectManager(this.game);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, game.width/2, game.height/2, 
        groups.foreground);
    this.camera.follow(player);
    globals.player = player;

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.hud);
    globals.debugDisplay = new DebugDisplay(game, groups.foreground);
    
    // Keep track of what wave the player is on using the globals object.
    var waveNum = 0;
    globals.waveNum = waveNum;

    // Enemy Waves
    var SpawnerWave = require("../game-objects/waves/spawn-wave.js");
    globals.spawnEnemies = new SpawnerWave(game);

    // Pickups
    var PickupSpawner = require("../game-objects/pickups/pickup-spawner.js");
    new PickupSpawner(game);

    // // Menu for switching tile maps
    // var menu = [];
    // var x = game.width - 36;
    // for (var i = 0; i < globals.tilemapFiles.length; i++) {
    //     // The callback needs a reference to the value of i on each iteration,
    //     // so create a callback with binding
    //     var cb = game.state.start.bind(game.state, "load", true, true, 
    //         "resources/tilemaps/" + globals.tilemapFiles[i]);
    //     var b = game.add.button(x, (36 * i) + 4, "button", cb);
    //     b.fixedToCamera = true;
    //     menu.push(b);
    // }
    // this.menu = menu;
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
    // Nothing here yet...
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