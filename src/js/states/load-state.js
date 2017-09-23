/**
 * LoadState - this is the loading screen
 */

import { GAME_STATE_NAMES } from "./index.js";
import { gameStore } from "../game-data/observable-stores";

export default class LoadState extends Phaser.State {
  preload() {
    // Images
    const atlasPath = `resources/atlases`;
    this.load.atlasJSONHash("assets", `${atlasPath}/assets.png`, `${atlasPath}/assets.json`);
    this.load.atlasJSONHash(
      "glowing-light",
      `${atlasPath}/glowing-light.png`,
      `${atlasPath}/glowing-light.json`
    );
    this.load.atlasJSONHash(
      "echo-light",
      `${atlasPath}/echo-light.png`,
      `${atlasPath}/echo-light.json`
    );
    this.load.atlasJSONHash(
      "rotating-light",
      `${atlasPath}/rotating-light.png`,
      `${atlasPath}/rotating-light.json`
    );

    // Tilemap
    for (const tilemapName of this.game.globals.tilemapNames) {
      const path = `resources/tilemaps/${tilemapName}.json`;
      const key = tilemapName.split(".")[0];
      this.load.tilemap(key, path, null, Phaser.Tilemap.TILED_JSON);
    }
    this.load.image("tiles", "resources/tilemaps/tiles.png");
    this.load.image("dungeon-tiles", "resources/tilemaps/dungeon-tiles.png");

    // Sounds
    const audioPath = "resources/audio";
    const audioFiles = [
      "pop.mp3",
      "whoosh.mp3",
      "whoosh-2.mp3",
      "warp.mp3",
      "warp-2.mp3",
      "impact.mp3",
      "impact-2.mp3",
      "smash.mp3"
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

    // this.game.state.start(GAME_STATE_NAMES.START_MENU);
    gameStore.setGameState(GAME_STATE_NAMES.START_MENU);
  }
}
