/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

module.exports = BootState;

function BootState() {}

BootState.prototype.create = function () {
	// For whatever reason, this hack helps CSS fonts load before the JS runs
    this.add.text(0, 0, "a", { font:"1px 'Alfa Slab One'", fill:"#FFF" });
    // Take care of any global game settings that need to be set up
    this.game.renderer.renderSession.roundPixels = false;
    // Disable cursor
    this.game.canvas.style.cursor = "none";
    // Disable the built-in pausing. This is useful for debugging, but may also
    // be useful for the game logic
    this.stage.disableVisibilityChange = true;
    this.stage.backgroundColor = "#F9F9F9";

    // Load the Slick UI plugin
    var globals = this.game.globals;
    globals.plugins.SlickUI = require("../plugins/slick-ui");
    globals.plugins.slickUI = this.game.plugins.add(Phaser.Plugin.SlickUI);

    this.game.state.start("load");
};