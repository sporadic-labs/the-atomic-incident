/**
 * Sandbox - this is the main level for now
 */

var PickupSpawner = require("../game-objects/pickups/pickup-spawner.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../game-objects/components/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/hud/heads-up-display.js");
const SoundEffectManager = require("../game-objects/fx/sound-effect-manager.js");
const EffectsPlugin = require("../plugins/camera-effects-plugin/camera-effects-plugin.js");
const LevelManager = require("../game-objects/components/level-manager.js");

import MENU_STATES from "../menu/menu-states";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import { autorun } from "mobx";
import PhaserNavmesh from "phaser-navmesh/src/library";
import EnemySpawner from "../game-objects/enemies/enemy-spawner";

export default class Sandbox extends Phaser.State {
  create() {
    // Shorthands
    var game = this.game;
    var globals = game.globals;

    // Debugging FPS
    game.time.advancedTiming = true;

    // Canvas styling
    game.canvas.addEventListener("contextmenu", function(e) {
      e.preventDefault();
    });

    // Groups for z-index sorting and for collisions
    const groups = {
      game: game.add.group(this.world, "game"),
      gameOverlay: game.add.group(this.world, "game-overlay"),
      hud: game.add.group(this.world, "hud")
    };
    groups.background = game.add.group(groups.game, "background");
    groups.midground = game.add.group(groups.game, "midground");
    groups.foreground = game.add.group(groups.game, "foreground");
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding");
    groups.pickups = game.add.group(groups.foreground, "pickups");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#FFF";

    // Plugins
    global.plugins = global.plugins !== undefined ? global.plugins : {};
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

    // Sound manager
    globals.soundManager = new SoundEffectManager(this.game);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    const PostProcessor = require("../game-objects/fx/post-processor.js");
    globals.postProcessor = new PostProcessor(game, globals.groups.game);

    // Player
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, game.width / 2, game.height / 2, groups.foreground);
    this.camera.follow(player);
    globals.player = player;

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.hud);

    // Keep track of what wave the player is on using the globals object.
    var waveNum = 0;
    globals.waveNum = waveNum;

    // Waves of pickups and enemies
    new PickupSpawner(game);
    new EnemySpawner(game, player);

    // Subscribe to the debug settings
    autorun(() => {
      this.lighting.setOpacity(preferencesStore.shadowOpacity);
      if (preferencesStore.physicsDebug) globals.plugins.satBody.enableDebugAll();
      else globals.plugins.satBody.disableDebugAll();
      globals.postProcessor.visible = preferencesStore.shadersEnabled;
    });
    // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
    // muted will be ignored. Instead, sync volume any time the game is unmuted.
    this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));

    // Debug menu
    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
      gameStore.setMenuState(MENU_STATES.DEBUG);
      gameStore.pause();
    });
  }

  getMapPoints(key) {
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
        });
      }
    }
    return mapPoints;
  }

  shutdown() {
    // Destroy all plugins (MH: should we be doing this or more selectively
    // removing plugins?)
    this.game.plugins.removeAll();
  }
}
