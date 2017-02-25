/**
 * UI Test State
 */

module.exports = SlickTestUI;

function SlickTestUI() {}

SlickTestUI.prototype.preload = function () {
    // Slick UI theme need to be preloaded in the state that uses it:
    //  https://github.com/Flaxis/slick-ui/issues/8#issuecomment-251337961
    var globals = this.game.globals;
    globals.plugins.slickUI.load("resources/themes/kenny/kenney.json");
};

SlickTestUI.prototype.create = function () {
    // Shorthands
    var game = this.game;
    var globals = game.globals;
    var slickUI = globals.plugins.slickUI;
    var SlickUI = globals.plugins.SlickUI;

    var panel;
    slickUI.add(panel = new SlickUI.Element.Panel(8, 8, 150, game.height - 16));
    var button;
    panel.add(button = new SlickUI.Element.Button(0,0, 140, 80));
    button.events.onInputUp.add(function () {console.log('Clicked button');});
    button.add(new SlickUI.Element.Text(0,0, "My button")).center();
};