/**
 * Sandbox - this is the main level for now
 */

import Color from "../helpers/color";
import SatBodyPlugin from "../plugins/sat-body-plugin-revisited/plugin";
import LightingPlugin from "../plugins/lighting-plugin-optimized/lighting-plugin";
import EffectsPlugin from "../plugins/camera-effects-plugin/camera-effects-plugin.js";
import { GAME_STATE_NAMES } from "./index";
import { MENU_STATE_NAMES } from "../menu";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import { autorun } from "mobx";
import MapManager from "../game-objects/level-manager";

export default class StartMenu extends Phaser.State {
  create() {
    gameStore.setMenuState(MENU_STATE_NAMES.START_MENU);

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
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    globals.plugins.effects = game.plugins.add(EffectsPlugin);

    // Level manager
    const mapName = globals.tilemapNames[0];
    const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
    globals.mapManager = mapManager;

    // Lighting plugin - needs to be set up after level manager
    this.lighting = globals.plugins.lighting = game.plugins.add(LightingPlugin, {
      parent: groups.foreground,
      walls: mapManager.walls,
      shouldUpdateImageData: false,
      shadowOpacity: 1,
      debugEnabled: false
    });
    const shape = new Phaser.Circle(0, 0, 625);
    const light = globals.plugins.lighting.addLight(
      new Phaser.Point(game.width / 2, game.height / 2),
      shape,
      Color.white(),
      Color.white()
    );
    this.tween = this.game.tweens
      .create(shape)
      .to({ diameter: 500 }, 1750)
      .easing(Phaser.Easing.Quadratic.InOut)
      .loop(true)
      .yoyo(true)
      .onUpdateCallback(() => {
        light.setShape(shape);
      })
      .start();

    // Subscribe to the debug settings
    this.storeUnsubscribe = autorun(() => {
      this.lighting.setOpacity(preferencesStore.shadowOpacity);
      if (preferencesStore.physicsDebug) globals.plugins.satBody.enableDebugAll();
      else globals.plugins.satBody.disableDebugAll();
      // globals.postProcessor.visible = preferencesStore.shadersEnabled;
      game.paused = gameStore.isPaused;
    });
    // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
    // muted will be ignored. Instead, sync volume any time the game is unmuted.
    this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));
    this.game.sound.volume = preferencesStore.volume; // Sync volume on first load
  }

  shutdown() {
    this.storeUnsubscribe();
    this.tween.stop();
    // Destroy all plugins (MH: should we be doing this or more selectively removing plugins?)
    this.game.plugins.removeAll();
  }
}
