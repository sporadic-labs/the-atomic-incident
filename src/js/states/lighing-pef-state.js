/**
 * Sandbox - this is the main level for now
 */

import Color from "../helpers/color";
import LightingPlugin from "../plugins/lighting-plugin/lighting-plugin.js";
import LightingPluginOptimized from "../plugins/lighting-plugin-optimized/lighting-plugin.js";
import EffectsPlugin from "../plugins/camera-effects-plugin/camera-effects-plugin.js";
import { GAME_STATE_NAMES } from "./index";
import { MENU_STATE_NAMES } from "../menu";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import { autorun } from "mobx";
import MapManager from "../game-objects/level-manager";

export default class LightingPerf extends Phaser.State {
  create() {
    // Shorthands
    const game = this.game;
    const globals = game.globals;

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

    // Plugins
    global.plugins = global.plugins !== undefined ? global.plugins : {};
    globals.plugins.effects = game.plugins.add(EffectsPlugin);

    // Level manager
    const mapName = globals.tilemapNames[0];
    const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
    globals.mapManager = mapManager;

    // Lighting plugin - needs to be set up after level manager
    this.lighting = globals.plugins.lighting = game.plugins.add(LightingPluginOptimized, {
      parent: groups.foreground,
      walls: mapManager.walls,
      shouldUpdateImageData: false,
      shadowOpacity: 1,
      debugEnabled: false
    });
    const shape = new Phaser.Circle(0, 0, 625);
    const light = globals.plugins.lighting.addLight(
      new Phaser.Point(game.width / 2 - 175, game.height / 2),
      shape,
      Color.white()
    );
    this.light = light;
    this.tween = this.game.tweens
      .create(light.position)
      .to({ x: game.width / 2 + 175 }, 3000)
      .easing(Phaser.Easing.Quadratic.InOut)
      .loop(true)
      .yoyo(true)
      .start();
    this.light.shouldUpdateImageData = true;

    // for (let i = 0; i < 15; i++) {
    //   const shape = new Phaser.Circle(0, 0, 300);
    //   const startingPoint = new Phaser.Point(
    //     game.rnd.integerInRange(100, game.width - 100),
    //     300,
    //   );
    //   const light = globals.plugins.lighting.addLight(startingPoint, shape, Color.white());
    //   this.tween = this.game.tweens
    //     .create(light.position)
    //     .to({ y: game.height - 300 }, 3000)
    //     .easing(Phaser.Easing.Quadratic.InOut)
    //     .loop(true)
    //     .yoyo(true)
    //     .start();
    // }

    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
      gameStore.setMenuState(MENU_STATE_NAMES.DEBUG);
      gameStore.pause();
    });

    // Subscribe to the debug settings
    this.storeUnsubscribe = autorun(() => {
      this.lighting.setOpacity(preferencesStore.shadowOpacity);
      // globals.postProcessor.visible = preferencesStore.shadersEnabled;
      game.paused = gameStore.isPaused;
    });
    // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
    // muted will be ignored. Instead, sync volume any time the game is unmuted.
    this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));
    this.game.sound.volume = preferencesStore.volume; // Sync volume on first load

    // FPS
    this._fpsText = game.make.text(15, game.height - 25, "60", {
      font: "18px 'Montserrat'",
      fill: "#ff8000"
    });
    this._fpsText.anchor.set(0, 1);
    groups.hud.add(this._fpsText);
  }

  update() {
    if (this._fpsText) {
      this._fpsText.setText(this.game.time.fps);
    }
  }

  shutdown() {
    this.storeUnsubscribe();
    this.tween.stop();
    // Destroy all plugins (MH: should we be doing this or more selectively removing plugins?)
    this.game.plugins.removeAll();
  }
}
