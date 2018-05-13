import Phaser from "phaser";
import get from "lodash.get";
import Player from "../game-objects/player";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import { MENU_STATE_NAMES } from "../menu";
import getFontString from "../fonts/get-font-string";
import WEAPON_TYPES from "../game-objects/weapons/weapon-types";

// import PickupSpawner from "../game-objects/pickups/pickup-spawner.js";
// // import LightingPlugin from "../plugins/lighting-plugin/lighting-plugin.js";
// import LightingPlugin from "../plugins/lighting-plugin-optimized/lighting-plugin.js";
// import Player from "../game-objects/player";
// import SoundEffectManager from "../game-objects/fx/sound-effect-manager.js";
// import EffectsPlugin from "../plugins/camera-effects-plugin/camera-effects-plugin.js";
// import PostProcessor from "../game-objects/fx/post-processor.js";
// import { autorun } from "mobx";
// import MapManager from "../game-objects/level-manager";
// import EnemySpawner from "../game-objects/enemies/enemy-spawner";
// import EnemyGroup from "../game-objects/enemies/enemy-group";
// import EnergyPickup from "../game-objects/pickups/energy-pickup";
// import WeaponSpawner from "../game-objects/pickups/weapon-spawner";
// import Score from "../game-objects/hud/score";
// import Combo from "../game-objects/hud/combo";
// import Radar from "../game-objects/hud/radar/";
// import Ammo from "../game-objects/hud/ammo";
// import DashIcon from "../game-objects/hud/dash-icon";
// import AudioProcessor from "../game-objects/fx/audio-processor";
// import PopUpText from "../game-objects/hud/pop-up-text";
// import SatBodyPlugin from "../plugins/sat-body-plugin-revisited/plugin";
// import DifficultyModifier from "../game-objects/difficulty-modifier";
// import { registerGameStart } from "../analytics";
// import ImageBar from "../game-objects/hud/image-bar";
// import WaveHud from "../game-objects/hud/wave";
// import HudMessageDisplay from "../game-objects/hud/hud-message-display";

export default class Play extends Phaser.Scene {
  create() {
    console.log("loaded play");

    // Load the map from the Phaser cache
    const tilemap = this.add.tilemap("horizontal-1");
    const tileset = tilemap.addTilesetImage("tiles");
    tilemap.createStaticLayer("bg", tileset);
    const wallLayer = tilemap.createStaticLayer("walls", tileset);
    wallLayer.setCollisionByProperty({ collides: true });

    const spawnObject = get(tilemap.getObjectLayer("player-spawn"), "objects[0]", null);
    const spawnPoint = spawnObject
      ? { x: spawnObject.x, y: spawnObject.y }
      : { x: tilemap.widthInPixels / 2, y: tilemap.heightInPixels / 2 };
    const player = new Player(this, spawnPoint.x, spawnPoint.y); // TODO: player goes in FG
    this.cameras.main.startFollow(player.sprite);

    this.physics.add.collider(player.sprite, wallLayer);

    this.hud = this.add.container().setScrollFactor(0); // TODO: add to FG

    // const pickupLocations = get(tilemap.getObjectLayer("pickups"), "objects", []).map(
    //   pickup => new Phaser.Math.Vector2(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2)
    // );
    // new PickupSpawner(this, pickups, pickupLocations, player);
    // Use the 'P' button to pause/unpause, as well as the button on the HUD.
    this.input.keyboard.on("keydown_P", () => {
      if (gameStore.isPaused) {
        gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
        gameStore.unpause();
      } else {
        gameStore.setMenuState(MENU_STATE_NAMES.PAUSE);
        gameStore.pause();
      }
    });

    // Optional debug menu, pause w/o menus, switch weapons and fps text
    if (!PRODUCTION) {
      this.input.keyboard.on("keydown_E", () => {
        gameStore.setMenuState(MENU_STATE_NAMES.DEBUG);
        gameStore.pause();
      });

      this.input.keyboard.on("keydown_O", () => {
        if (!gameStore.menuState === MENU_STATE_NAMES.CLOSED) return;
        if (gameStore.isPaused) gameStore.unpause();
        else gameStore.pause();
      });

      this.input.keyboard.on("keydown_R", () => {
        // groups.enemies.killAll(); // TODO: kill all enemies
      });

      this.input.keyboard.on("keydown_K", () => {
        // enemySpawner._spawnWave(); // TODO: Spawn normal wave
      });

      this.input.keyboard.on("keydown_L", () => {
        // enemySpawner._spawnSpecialWave(); // TODO: Spawn special wave
      });

      // TODO: Manually switch weapons with the number keys
      const keys = ["ONE", "TWO", "THREE", "FOUR", "FIVE", "SIX", "SEVEN", "EIGHT", "NINE"];
      const weapons = Object.values(WEAPON_TYPES);
      for (let i = 0; i < Math.min(keys.length, weapons.length); i++) {
        this.input.keyboard.on(`keydown_${keys[i]}`, () => {
          if (gameStore.menuState === MENU_STATE_NAMES.CLOSED) {
            // player.weaponManager.switchWeapon(weapons[i]);
            // ammo.updateWeapon();
          }
        });
      }

      this.fpsText = this.add.text(5, 750 - 45, "", {
        font: getFontString("Montserrat", { size: "12px", weight: 400 }),
        color: "#00ffff"
      });
      this.fpsText.setOrigin(0, 1);
      this.hud.add(this.fpsText);
    }
  }

  update(time, delta) {
    if (this.fpsText) this.fpsText.setText(`FPS: ${(1000 / delta).toFixed(2)}`);
  }

  // create() {
  //   // Groups for z-index sorting and for collisions
  //   const groups = {
  //     game: game.add.group(this.world, "game"),
  //     gameOverlay: game.add.group(this.world, "game-overlay")
  //   };
  //   groups.background = game.add.group(groups.game, "background");
  //   groups.midground = game.add.group(groups.game, "midground");
  //   groups.foreground = game.add.group(groups.game, "foreground");
  //   groups.pickups = game.add.group(groups.midground, "pickups");
  //   groups.enemies = new EnemyGroup(game, groups.midground);
  //   groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding");
  //   globals.groups = groups;
  //   // Plugins
  //   global.plugins = global.plugins !== undefined ? global.plugins : {};
  //   globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
  //   globals.plugins.effects = game.plugins.add(EffectsPlugin);
  //   // Level manager
  //   const mapName = globals.tilemapNames[0];
  //   const mapManager = new MapManager(game, mapName, groups.background, groups.foreground);
  //   globals.mapManager = mapManager;
  //   // Lighting plugin - needs to be set up after level manager
  //   globals.plugins.lighting = game.plugins.add(LightingPlugin, {
  //     parent: groups.foreground,
  //     walls: mapManager.walls,
  //     shouldUpdateImageData: false,
  //     shadowOpacity: 1,
  //     debugEnabled: false
  //   });
  //   this.lighting = globals.plugins.lighting;
  //   // Sound manager
  //   globals.soundManager = new SoundEffectManager(this.game);
  //   // Difficulty
  //   globals.difficultyModifier = new DifficultyModifier();
  //   globals.postProcessor = new PostProcessor(game, globals.groups.game);
  //   globals.audioProcessor = new AudioProcessor(game);
  //   // Waves of pickups and enemies
  //   new PickupSpawner(game);
  //   const enemySpawner = new EnemySpawner(game, player);
  //   this.enemySpawner = enemySpawner;
  //   const weaponSpawner = new WeaponSpawner(game, groups.pickups, player, mapManager);
  //   // HUD
  //   const hudMessageDisplay = new HudMessageDisplay(game, groups.hud);
  //   new Radar(game, groups.foreground, player, this.game.globals.groups.enemies, weaponSpawner);
  //   const combo = new Combo(game, groups.hud, player, globals.groups.enemies);
  //   combo.position.set(this.game.width - 5, 32);
  //   const score = new Score(game, groups.hud, globals.groups.enemies, combo, hudMessageDisplay);
  //   score.position.set(this.game.width - 5, 5);
  //   const ammo = new Ammo(game, groups.hud, player, weaponSpawner);
  //   ammo.position.set(game.width - 5, game.height - 5);
  //   this.add.sprite(4, 4, "assets", "hud/health-icon", groups.hud);
  //   const dashIcon = new DashIcon(game, groups.hud, player);
  //   dashIcon.position.set(4, 36);
  //   const playerHealth = new ImageBar(game, groups.hud, {
  //     x: 35,
  //     y: 7,
  //     interiorKey: "hud/health-bar-interior",
  //     outlineKey: "hud/health-bar-outline"
  //   });
  //   player.onHealthChange.add(newHealth => playerHealth.setValue(newHealth));
  //   new WaveHud(game, groups.hud, enemySpawner.onWaveSpawn);
  //   // Difficulty toast messages
  //   globals.difficultyModifier.onDifficultyChange.add((previousDifficulty, difficulty) => {
  //     const truncatedPreviousDifficulty = Math.floor(previousDifficulty * 10) / 10;
  //     const truncatedDifficulty = Math.floor(difficulty * 10) / 10;
  //     if (truncatedDifficulty > truncatedPreviousDifficulty) {
  //       // Difficulty has changed in the 10s decimal place
  //       hudMessageDisplay.setMessage(`${truncatedDifficulty.toFixed(2)}x speed`);
  //     }
  //   });
  //   // Combo "toast" messages
  //   weaponSpawner.onPickupCollected.add(pickup => {
  //     const location = Phaser.Point.add(pickup, new Phaser.Point(0, -30));
  //     const w = player.weaponManager.getActiveWeapon();
  //     new PopUpText(game, globals.groups.foreground, w.getName(), location);
  //   });
  //   globals.groups.enemies.onEnemyKilled.add(enemy => {
  //     new EnergyPickup(this.game, enemy.x, enemy.y, globals.groups.pickups, player);
  //   });
  //   // Subscribe to the debug settings
  //   this.storeUnsubscribe = autorun(() => {
  //     this.lighting.setOpacity(preferencesStore.shadowOpacity);
  //     if (preferencesStore.physicsDebug) this.physics.sat.world.enableDebug();
  //     else this.physics.sat.world.disableDebug();
  //     globals.postProcessor.visible = preferencesStore.shadersEnabled;
  //     game.paused = gameStore.isPaused;
  //   });
  //   // Note: pausing and unpausing mutes/unmutes Phaser's sound manager. Changing the volume while
  //   // muted will be ignored. Instead, sync volume any time the game is unmuted.
  //   this.game.sound.onUnMute.add(() => (this.game.sound.volume = preferencesStore.volume));
  //   this.game.sound.volume = preferencesStore.volume; // Sync volume on first load
  // }
  // shutdown() {
  //   this.enemySpawner.destroy();
  //   this.storeUnsubscribe();
  //   // Destroy all plugins (MH: should we be doing this or more selectively removing plugins?)
  //   this.game.plugins.removeAll();
  // }
}
