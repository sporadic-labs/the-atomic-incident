/**
 * LoadState - this is the loading screen
 */

import { GAME_STATE_NAMES } from "./index.js";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import loadFonts from "../fonts/font-loader";
import logger from "../helpers/logger";

export default class LoadState extends Phaser.State {
  preload() {
    // Fonts
    this.fontsLoaded = false;
    this.fontsErrored = false;
    loadFonts(3000)
      .then(() => (this.fontsLoaded = true))
      .catch(error => {
        this.fontsErrored = true;
        logger.error(`Fonts unable to load! Error ${error}`);
      });

    // Images
    const atlasPath = `resources/atlases`;
    this.load.atlasJSONHash("assets", `${atlasPath}/assets.png`, `${atlasPath}/assets.json`);

    // Tilemap
    for (const tilemapName of this.game.globals.tilemapNames) {
      const path = `resources/tilemaps/${tilemapName}.json`;
      const key = tilemapName.split(".")[0];
      this.load.tilemap(key, path, null, Phaser.Tilemap.TILED_JSON);
    }
    this.load.image("tiles", "resources/tilemaps/tiles.png");

    // Sounds
    const audioPath = "resources/audio";
    const audioFiles = [
      "fx/squish.mp3",
      "fx/squish-impact-faster.mp3",
      "fx/light-powerup.mp3",
      "fx/crate-pickup.mp3",
      "fx/fire-whoosh-2.mp3",
      "fx/multishot.mp3",
      "fx/rapid-shot-2.mp3",
      "fx/wall-hit.mp3",
      "fx/enemy-shoot.mp3",
      "fx/missile.mp3",
      "fx/piercing-shot.mp3",
      "fx/homing-missile.mp3",
      "fx/rocket-explosion.mp3",
      "fx/dash.mp3",
      "fx/empty-ammo-dry-fire.mp3",
      "fx/bubble-bouncing-projectile.mp3",
      "fx/player-death.mp3",
      "fx/player-hit.mp3",
      "music/hate-bay.mp3"
    ];
    audioFiles.forEach(filename => {
      const name = filename.slice(0, -4); // Remove extension
      this.load.audio(name, `${audioPath}/${filename}`);
    });

    // Stand-in for a loading bar
    this.loadingText = this.add.text(this.world.centerX, this.world.centerY, "0%", {
      font: "200px Arial",
      fill: "#000",
      align: "center"
    });
    this.loadingText.anchor.set(0.5);
  }

  loadRender() {
    this.loadingText.setText(this.load.progress + "%");
  }

  create() {
    // Since load progress might not reach 100 in the load loop, manually do it
    this.loadingText.setText("100%");
  }

  update() {
    // To fail gracefully, allow the game to load if the fonts errored
    if (this.fontsLoaded || this.fontsErrored) {
      this.game.globals.musicSound = this.sound.play("music/hate-bay", 0.09, true);
      if (preferencesStore.musicMuted) {
        // Phaser bug - don't use pause for this since it won't work with the state being switched
        // immediately after pausing
        this.game.globals.musicSound.mute = true;
      }

      if (preferencesStore.skipMenu) gameStore.setGameState(GAME_STATE_NAMES.PLAY);
      else gameStore.setGameState(GAME_STATE_NAMES.START_MENU);
    }
  }
}
