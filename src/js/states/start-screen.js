/**
 * StartScreen - start here!
 */

module.exports = StartScreen;

var Reticule = require("../game-objects/reticule.js");

function StartScreen() {}

StartScreen.prototype.create = function () {
    // Groups for z-index sorting and for collisions
    this.groups = {
        background: this.game.add.group(this.world, "background"),
        midground: this.game.add.group(this.world, "midground"),
        foreground: this.game.add.group(this.world, "foreground")
    };

    this.bg = this.add.tileSprite(0, 0, 2000, 2000, "assets", "hud/grid", 
        this.groups.background);

    var logo = this.game.add.sprite(this.world.centerX, this.world.centerY-160,
        "assets", "startScreen/logo");
    logo.anchor.setTo(0.5,0.5);
    this.groups.midground.add(logo);
    var playBtn = this.game.add.button(this.world.centerX,
        this.world.centerY+20, "assets", this._playTheGame, this,
        "startScreen/play-down", "startScreen/play-up");
    playBtn.anchor.setTo(0.5,0.5);
    this.groups.midground.add(playBtn);
    var optionsBtn = this.game.add.button(this.world.centerX,
        this.world.centerY+140, "assets", this._options, this,
        "startScreen/options-down", "startScreen/options-up");
    optionsBtn.anchor.setTo(0.5,0.5);
    this.groups.midground.add(optionsBtn);

    this.reticule = new Reticule(this, this.groups.foreground);
};

StartScreen.prototype._playTheGame = function () {
    this.game.state.start("game");
};

StartScreen.prototype._options = function () {
    console.log("trick!");
};
