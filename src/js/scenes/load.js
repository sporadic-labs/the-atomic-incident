import Phaser from "phaser";
import { SCENE_NAMES } from "./index.js";
import { gameStore, preferencesStore } from "../game-data/observable-stores";
import loadFonts from "../fonts/font-loader";
import logger from "../helpers/logger";

export default class Load extends Phaser.Scene {
  preload() {
    const globals = this.registry.parent.globals;

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
    this.load.atlas("assets", `${atlasPath}/assets.png`, `${atlasPath}/assets.json`);

    // Tilemap
    for (const tilemapName of globals.tilemapNames) {
      const path = `resources/tilemaps/${tilemapName}.json`;
      const key = tilemapName.split(".")[0];
      this.load.tilemapTiledJSON(key, path);
    }
    this.load.image("tiles", "resources/tilemaps/tiles-extruded.png");

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
    const loadingBar = this.add.graphics();
    this.load.on("progress", value => {
      loadingBar.clear();
      loadingBar.fillStyle(0xffffff, 1);
      loadingBar.fillRect(0, 750 / 2 - 25, 750 * value, 50);
    });
    this.load.on("complete", () => loadingBar.destroy());
  }

  update() {
    const globals = this.registry.parent.globals;

    // To fail gracefully, allow the game to load if the fonts errored
    if (this.fontsLoaded || this.fontsErrored) {
      // TODO: sort out how to handle global music
      // globals.musicSound = this.sound.play("music/hate-bay", 0.09, true);
      // if (preferencesStore.musicMuted) {
      //   // Phaser bug - don't use pause for this since it won't work with the state being switched
      //   // immediately after pausing
      //   globals.musicSound.mute = true;
      // }

      if (preferencesStore.skipMenu) gameStore.setGameState(SCENE_NAMES.PLAY);
      else gameStore.setGameState(SCENE_NAMES.START_MENU);
    }
  }
}
