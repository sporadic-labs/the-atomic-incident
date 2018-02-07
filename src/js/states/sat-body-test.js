/**
 * SAT BODY PHYSICS TESTING
 */

import Color from "../helpers/color";
import SatBodyPlugin from "../plugins/sat-body-plugin/sat-body-plugin.js";
import LightingPlugin from "../plugins/lighting-plugin/lighting-plugin.js";
import LightingPluginOptimized from "../plugins/lighting-plugin-optimized/lighting-plugin.js";
import NewSatBodyPlugin from "../plugins/sat-body-plugin-revisited/plugin";
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

    // Initializing the world
    this.stage.backgroundColor = "#FFF";

    // Plugins
    global.plugins = global.plugins !== undefined ? global.plugins : {};

    // Level manager
    const mapName = globals.tilemapNames[0];
    const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
    globals.mapManager = mapManager;

    game.input.keyboard.addKey(Phaser.Keyboard.E).onDown.add(() => {
      gameStore.setMenuState(MENU_STATE_NAMES.DEBUG);
      gameStore.pause();
    });

    // Subscribe to the debug settings
    this.storeUnsubscribe = autorun(() => {
      // globals.postProcessor.visible = preferencesStore.shadersEnabled;
      game.paused = gameStore.isPaused;
    });

    // FPS
    this._fpsText = game.make.text(15, game.height - 25, "60", {
      font: "18px 'Alfa Slab One'",
      fill: "#ff8000"
    });
    this._fpsText.anchor.set(0, 1);
    groups.hud.add(this._fpsText);

    // --- TESTING ---
    globals.plugins.newSatBody = game.plugins.add(NewSatBodyPlugin);
    const sat = this.physics.sat;
    sat.world.enableDebug(this.game.add.graphics(0, 0, globals.groups.hud));

    const sprite1 = game.add.sprite(200, 250, "assets", "physics-test/box", globals.groups.game);
    const body1 = this.physics.sat.add
      .gameObject(sprite1, { shape: "rectangle" })
      .setVelocity(100, 25);
    this.body1 = body1;
    this.physics.sat.add.collider(sprite1, this.game.globals.mapManager.wallLayer);

    const sprite2 = game.add.sprite(250, 200, "assets", "physics-test/box", globals.groups.game);
    const body2 = sat.add.body({ gameObject: sprite2, shape: { type: "circle", radius: 40 } });
    this.body2 = body2;
    this.physics.sat.add.collider(sprite2, this.game.globals.mapManager.wallLayer);

    const circleBody = sat.add
      .body({ shape: { type: "circle", radius: 25 } })
      .setPosition(250, 300)
      .setVelocity(-200, 150);
    this.circleBody = circleBody;
    this.physics.sat.add.collider(circleBody, this.game.globals.mapManager.wallLayer);

    const group = this.game.add.group();
    for (let i = 0; i < 8; i++) {
      const x = this.game.rnd.integerInRange(200, 400);
      const y = this.game.rnd.integerInRange(200, 400);
      const body = sat.add
        .body({
          gameObject: game.add.sprite(x, y, "assets", "physics-test/box", globals.groups.game)
        })
        .setRectangle(50, 50)
        .setVelocity(
          this.game.rnd.integerInRange(-400, 400),
          this.game.rnd.integerInRange(-400, 400)
        );
      group.add(body.gameObject);
    }
    this.group = group;
    this.physics.sat.add.collider(group, this.game.globals.mapManager.wallLayer);

    const key = "enemies/particle-tank/particle-tank";
    const polySprite = game.add.sprite(500, 300, "assets", key, globals.groups.game);
    const points = [[10, 31], [37, 2], [64, 29], [72, 55], [11, 58], [3, 51.2]].map(p => ({
      x: p[0] - 75 / 2,
      y: p[1] - 75 / 2
    }));
    const polyBody = this.physics.sat.add
      .gameObject(polySprite)
      .setPolygon(points)
      .setVelocity(-100, 25);
    polyBody.gameObject.anchor.set(0.5);

    this.physics.sat.add.collider(group, polySprite);
    this.physics.sat.add.collider(polySprite, this.game.globals.mapManager.wallLayer);

    // Extend right check:
    // sprite1.position.setTo(200, 250);
    // body1
    //   .setPosition(200, 250)
    //   .setVelocity(200, 150)
    //   .setBounce(1);

    // Extend down check:
    // sprite1.position.setTo(550, 300);
    // body1
    //   .setPosition(550, 300)
    //   .setVelocity(-250, -100)
    //   .setBounce(1);

    // this.input.onDown.add(() => {
    //   const x = this.input.x;
    //   const y = this.input.y;
    //   body1
    //     .setPosition(x, y)
    //     .setVelocity(200, 100)
    //     .setBounce(1);
    //   console.log(x, y);
    // });

    // this.input.onDown.add(() => {
    //   const b = new Body(satWorld, {
    //     gameObject: game.add.sprite(
    //       this.input.x,
    //       this.input.y,
    //       "assets",
    //       "physics-test/box",
    //       globals.groups.game
    //     )
    //   }).setRectangle(50, 50);
    //   satWorld.add(b);
    //   b.gameObject.rotation = this.game.rnd.between(0, 2 * Math.PI);
    //   b.bounce = 1;
    //   b.velocity.setTo(this.game.rnd.between(-200, 200), this.game.rnd.between(-200, 200));
    // });
  }

  update() {
    // this.b1.gameObject.rotation += 0.005;
    // this.body2.position.copyFrom(this.input.position);

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
