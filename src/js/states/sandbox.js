/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var PickupSpawner = require("../game-objects/pickups/pickup-spawner.js");
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
var colors = require("../constants/colors.js");
const SpriteLight = require("../plugins/lighting-plugin/sprite-light");

import PhaserNavmesh from "phaser-navmesh/src/library";
import {mapName, makeLevel} from "../levels/dungeon-arcade-1";
import WaveManager from "../game-objects/waves/wave-manager";
import { AmmoManager } from '../game-objects/components/ammo-manager.js';

function Sandbox() {}

Sandbox.prototype.preload = function () {
    // Slick UI theme need to be preloaded in the state that uses it:
    //  https://github.com/Flaxis/slick-ui/issues/8#issuecomment-251337961
    // NOTE(rex): Created in boot-state.js.
    var globals = this.game.globals;
    globals.plugins.slickUI = this.game.plugins.add(Phaser.Plugin.SlickUI);
    globals.plugins.slickUI.load("resources/themes/kenny/kenney.json");
};

Sandbox.prototype.create = function () {
    // Shorthands
    var game = this.game;
    var globals = game.globals;

    // Debugging FPS
    game.time.advancedTiming = true;

    // Canvas styling
    game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });

    // Create signals for the Pausing/Unpausing events.
    globals.onPause = new Phaser.Signal();
    globals.onUnPause = new Phaser.Signal();

    // Groups for z-index sorting and for collisions
    const groups = {
        game: game.add.group(this.world, "game"),
        gameOverlay: game.add.group(this.world, "game-overlay"),
        hud: game.add.group(this.world, "hud")
    };
    groups.background = game.add.group(groups.game, "background");
    groups.midground = game.add.group(groups.game, "midground");
    groups.foreground = game.add.group(groups.game, "foreground");
    groups.enemies = game.add.group(groups.midground, "enemies"),
    groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding"),
    groups.pickups = game.add.group(groups.foreground, "pickups"),
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#FFF";

    // Plugins
    global.plugins = (global.plugins !== undefined) ? global.plugins : {};
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    globals.plugins.effects = game.plugins.add(EffectsPlugin);
    globals.plugins.navMesh = game.plugins.add(PhaserNavmesh);
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);

    // Level manager
    const levelManager = new LevelManager(game, ...globals.tilemapNames);
    globals.levelManager = levelManager;

    // Lighting plugin - needs to be set up after level manager
    globals.plugins.lighting = game.plugins.add(LightingPlugin, groups.foreground);
    this.lighting = globals.plugins.lighting;
    this.lighting.setOpacity(1);

    // Load the waves
    // HACK: correct map needs to be loaded before initializing the level. That's because of the 
    // path tweening waves. Figure out a better way to do this...
    levelManager.switchMapByKey(mapName, false);
    const level = makeLevel(this.game);

    // Temp: switch between levels with 1 & 2 keys
    var map1 = game.input.keyboard.addKey(Phaser.Keyboard.NINE);
    map1.onDown.add(() => levelManager.switchMapByIndex(0));
    var map2 = game.input.keyboard.addKey(Phaser.Keyboard.ZERO);
    map2.onDown.add(() => levelManager.switchMapByIndex(1));

    // Sound manager
    globals.soundManager = new SoundEffectManager(this.game);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Ammo Manager
    globals.ammoManager = new AmmoManager(game, groups.hud);

    // Player
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, game.width/2, game.height/2, groups.foreground, level);
    this.camera.follow(player);
    globals.player = player;

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.hud);
    globals.debugDisplay = new DebugDisplay(game, groups.hud);

    // Keep track of what wave the player is on using the globals object.
    var waveNum = 0;
    globals.waveNum = waveNum;

    // Waves of pickups and enemies
    const pickupSpawner = new PickupSpawner(game);
    globals.spawnEnemies = new WaveManager(game, pickupSpawner, level);

    const PostProcessor = require("../game-objects/post-processor.js");
    globals.postProcessor = new PostProcessor(game, globals.groups.game);

    // Testing sprite lights!
    // const light = new SpriteLight(this.game, this.lighting.parent, new Phaser.Point(150, 200),
    //     new Phaser.Circle(0, 0, 200), colors.white, colors.red);
    // this.lighting.addExistingLight(light);

    level.start();

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

Sandbox.prototype.shutdown = function () {
    // Destroy all plugins (MH: should we be doing this or more selectively
    // removing plugins?)
    this.game.plugins.removeAll();
};