/**
 * Sandbox - this is the main level for now
 */

import PickupSpawner from "../game-objects/pickups/pickup-spawner.js";
import SatBodyPlugin from "../plugins/sat-body-plugin/sat-body-plugin.js";
import LightingPlugin from "../plugins/lighting-plugin/lighting-plugin.js";
import Player from "../game-objects/player";
import SoundEffectManager from "../game-objects/fx/sound-effect-manager.js";
import EffectsPlugin from "../plugins/camera-effects-plugin/camera-effects-plugin.js";
import PostProcessor from "../game-objects/fx/post-processor.js";
import { MENU_STATE_NAMES } from "../menu";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import { autorun } from "mobx";
import MapManager from "../game-objects/level-manager";
import EnemySpawner from "../game-objects/enemies/enemy-spawner";
import HeadsUpDisplay from "../game-objects/hud/heads-up-display.js";
import EnemyGroup from "../game-objects/enemies/enemy-group";
import EnergyPickup from "../game-objects/pickups/energy-pickup";
import Score from "../game-objects/hud/score";
import Combo from "../game-objects/hud/combo";
import Radar from "../game-objects/hud/radar";

export default class PlayState extends Phaser.State {
  create() {
    gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);

    // Shorthands
    const game = this.game;
    const globals = game.globals;

    // Groups for z-index sorting and for collisions
    const groups = {
      game: game.add.group(this.world, "game"),
      gameOverlay: game.add.group(this.world, "game-overlay"),
      hud: game.add.group(this.world, "hud")
    };
    groups.hud.fixedToCamera = true;
    groups.background = game.add.group(groups.game, "background");
    groups.midground = game.add.group(groups.game, "midground");
    groups.foreground = game.add.group(groups.game, "foreground");
    groups.enemies = new EnemyGroup(game, groups.midground);
    groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding");
    groups.pickups = game.add.group(groups.foreground, "pickups");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#FFF";

    // Plugins
    global.plugins = global.plugins !== undefined ? global.plugins : {};
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    globals.plugins.effects = game.plugins.add(EffectsPlugin);

    // Level manager
    const mapName = globals.tilemapNames[0];
    const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
    globals.mapManager = mapManager;

    // Lighting plugin - needs to be set up after level manager
    globals.plugins.lighting = game.plugins.add(
      LightingPlugin,
      groups.foreground,
      mapManager.walls
    );
    this.lighting = globals.plugins.lighting;

    // Sound manager
    globals.soundManager = new SoundEffectManager(this.game);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    globals.postProcessor = new PostProcessor(game, globals.groups.game);

    // Player
    // Setup a new player, and attach it to the global variabls object.
    const player = new Player(game, game.width / 2, game.height / 2, groups.foreground);
    this.camera.follow(player);
    globals.player = player;

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.hud);
    new Radar(game, groups.hud, this.game.globals.groups.enemies);

    const score = new Score(game, groups.hud);
    score.position.set(this.game.width - 18, 13);
    const combo = new Combo(game, groups.hud, player, globals.groups.enemies);
    combo.position.set(this.game.width - 18, 45);

    // Keep track of what wave the player is on using the globals object.
    const waveNum = 0;
    globals.waveNum = waveNum;

    // Waves of pickups and enemies
    new PickupSpawner(game);
    new EnemySpawner(game, player);

    globals.groups.enemies.onEnemyKilled.add(enemy => {
      new EnergyPickup(this.game, enemy.x, enemy.y, globals.groups.pickups, 15, 3);
    });

    // Subscribe to the debug settings
    this.storeUnsubscribe = autorun(() => {
      this.lighting.setOpacity(preferencesStore.shadowOpacity);
      if (preferencesStore.physicsDebug) globals.plugins.satBody.enableDebugAll();
      else globals.plugins.satBody.disableDebugAll();
      globals.postProcessor.visible = preferencesStore.shadersEnabled;
      game.paused = gameStore.isPaused;
    });
    // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
    // muted will be ignored. Instead, sync volume any time the game is unmuted.
    this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));
    this.game.sound.volume = preferencesStore.volume; // Sync volume on first load

    // Debug menu
    const debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C"
    });
    debugText.anchor.set(0, 1);
    groups.hud.add(debugText);
    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
      gameStore.setMenuState(MENU_STATE_NAMES.DEBUG);
      gameStore.pause();
    });

    // FPS
    this._fpsText = game.make.text(15, game.height - 25, "60", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C"
    });
    this._fpsText.anchor.set(0, 1);
    groups.hud.add(this._fpsText);
  }

  update() {
    this._fpsText.setText(this.game.time.fps);
  }

  shutdown() {
    this.storeUnsubscribe();
    // Destroy all plugins (MH: should we be doing this or more selectively removing plugins?)
    this.game.plugins.removeAll();
  }
}
