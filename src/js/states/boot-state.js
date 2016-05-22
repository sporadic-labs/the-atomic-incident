/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

module.exports = BootState;

function BootState(game) {}

BootState.prototype.create = function () {
    // Take care of any global game settings that need to be set up
    // Make sure that sprites are drawn at integer positions - to avoid 
    // sub-pixel position blurring
    this.game.renderer.renderSession.roundPixels = true;
    // Disable cursor
    this.game.canvas.style.cursor = "none";
    // Disable the built-in pausing. This is useful for debugging, but may also
    // be useful for the game logic
    this.stage.disableVisibilityChange = true;
    this.stage.backgroundColor = "#F9F9F9";

    this.game.state.start("load");
};