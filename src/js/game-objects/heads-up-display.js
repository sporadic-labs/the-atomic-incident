module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;
    this._options = this.game.globals.options;

    this.fixedToCamera = true;

    var textStyle = {
        font: "32px Arial",
        fill: "#9C9C9C",
        align: "left"
    };
    this._scoreText = game.make.text(30, 20, "Score: 0", textStyle);
    this.add(this._scoreText);
    this._heartsText = game.make.text(30, 60, "Hearts: 3", textStyle);
    this.add(this._heartsText);
    this._comboText = game.make.text(30, 100, "Combo: 0", textStyle);
    this.add(this._comboText);
    this._ammoText = game.make.text(30, 140, "Ammo: 0", textStyle);
    this.add(this._ammoText);
    // You have to setup the text before it has a width.  So set it up...
    this._weaponText = game.make.text((game.width / 2), game.height * 0.9,
        this._player.getGun()._name, textStyle);
    // And then update the position
    this._weaponText.x = (game.width / 2) - (this._weaponText.width / 2);
    this.add(this._weaponText);
    this._debugText = game.make.text(30, game.height - 45, 
        "Debug ('E' key): false", textStyle);
    this._debugText.fontSize = 14;
    this.add(this._debugText);
    this._controlText = game.make.text(30, game.height - 25, 
        "Control ('C' key): mouse", textStyle);
    this._controlText.fontSize = 14;
    this.add(this._controlText);
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreText.setText("Score: " + this._scoreKeeper.getScore());
    this._heartsText.setText("Hearts: " + this._player.hearts);
    if (this._player._gunType === "default") {
        this._ammoText.setText("Ammo: -");
    } else {
        this._ammoText.setText("Ammo: " + 
            this._player.getAmmo() + " / " + this._player.getGun()._totalAmmo);
    }
    this._comboText.setText("Combo: " + this._player.getCombo());
    this._weaponText.setText(this._player.getGun()._name);
    // Update the position of the weapon text, so if it has changed,
    // it will still be centered
    this._weaponText.x = (this.game.width / 2) - (this._weaponText.width / 2);

    this._debugText.setText("Debug ('E' key): " + 
        this._satBodyPlugin.isDebugAllEnabled());

    this._controlText.setText("Control ('C' key): " + 
        this._options.controlTypes[this._options.controls]);
};