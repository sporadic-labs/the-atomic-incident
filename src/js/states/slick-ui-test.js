/**
 * UI Test State
 */

module.exports = SlickTestUI;

var color = {
    h: 1,
    s: 1,
    l: 0.5,
    a: 1
};

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

    var panel = new SlickUI.Element.Panel(game.width - 208, 8, 200, 
        game.height - 16);
    slickUI.add(panel);

    var hSlider = new SlickUI.Element.Slider(20, 30, panel.width - 40, 1);
    panel.add(hSlider);
    var sSlider = new SlickUI.Element.Slider(20, 80, panel.width - 40, 1);
    panel.add(sSlider);
    var lSlider = new SlickUI.Element.Slider(20, 130, panel.width - 40, 0.5);
    panel.add(lSlider);
    var aSlider = new SlickUI.Element.Slider(20, 180, panel.width - 40, 1);
    panel.add(aSlider);

    hSlider.onDrag.add((value) => color.h = value); 
    sSlider.onDrag.add((value) => color.s = value); 
    lSlider.onDrag.add((value) => color.l = value); 
    aSlider.onDrag.add((value) => color.a = value);
};



SlickTestUI.prototype.update = function () {
    var c = Phaser.Color.HSLtoRGB(color.h, color.s, color.l);
    this.game.stage.backgroundColor = `rgb(${Math.round(c.r)},${Math.round(c.g)},${Math.round(c.b)})`;
};
