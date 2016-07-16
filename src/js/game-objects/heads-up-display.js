module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;

    this.fixedToCamera = true;

    var textStyle = {
        font: "32px Arial",
        fill: "#000",
        align: "left"
    };
    this._scoreText = game.make.text(30, 20, "Score: 0", textStyle);
    this.add(this._scoreText);
    this._comboText = game.make.text(30, 60, "Combo: 0", textStyle);
    this.add(this._comboText);
    this._ammoText = game.make.text(30, 100, "Ammo: 0", textStyle);
    this.add(this._ammoText);
    this._debugText = game.make.text(30, game.height - 40, 
        "Debug ('E' key): false", textStyle);
    this._debugText.fontSize = 14;
    this.add(this._debugText);
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreText.setText("Score: " + this._scoreKeeper.getScore());
    if (this._player._gunType === "default") {
        this._ammoText.setText("Ammo: -");
    } else {
        this._ammoText.setText("Ammo: " + 
            this._player._allGuns[this._player._gunType]._currentAmmo);
    }
    this._comboText.setText("Combo: " + this._player.getCombo());
    this._debugText.setText("Debug ('E' key): " + 
        this._satBodyPlugin.isDebugAllEnabled());
};