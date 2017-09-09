/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

import { GAME_STATE_NAMES } from "./index.js";

export default class BootState extends Phaser.State {
  create() {
    // For whatever reason, this hack helps CSS fonts load before the JS runs
    this.add.text(0, 0, "a", { font: "1px 'Alfa Slab One'", fill: "#FFF" });

    // Take care of any global game settings that need to be set up
    this.game.renderer.renderSession.roundPixels = false;

    // Disable the built-in pausing. This is useful for debugging, but may also
    // be useful for the game logic
    this.stage.disableVisibilityChange = true;
    this.stage.backgroundColor = "#F9F9F9";

    // Disable right click menu
    this.game.canvas.addEventListener("contextmenu", e => {
      e.preventDefault();
      return false;
    });

    // Debugging FPS
    this.game.time.advancedTiming = true;

    this.game.state.start(GAME_STATE_NAMES.LOAD);
  }
}
