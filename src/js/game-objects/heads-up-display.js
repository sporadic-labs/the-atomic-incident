module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;

    this._fogMask = game.make.sprite(0, 0, "fogMask");
    this.add(this._fogMask);
    this._fogMask.inputEnabled = false;
    /**
     * NOTE(rex): Use a flag to check if fog has been setup, this fixes
     * an issue with the fog not locking to player first time around.
     */
    this._fogSetup = false;

    this.fixedToCamera = true;

    var textStyle = {
        font: "32px Arial",
        fill: "#eee",
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
            this._player.getAmmo() + " / " + this._player.getGun()._totalAmmo);
    }
    this._comboText.setText("Combo: " + this._player.getCombo());
    this._debugText.setText("Debug ('E' key): " + 
        this._satBodyPlugin.isDebugAllEnabled());

    var pOffsetX = Math.floor(-1 * (400 + (this.game.camera.x - this._player.x)));
    var pOffsetY = Math.floor(-1 * (300 + (this.game.camera.y - this._player.y)));

    if ((pOffsetY != 0 || pOffsetX != 0) && this._fogSetup) {
        this._fogMask.x = pOffsetX;
        this._fogMask.y = pOffsetY;
    }
    if (!this._fogSetup) {
        this._fogMask.x = 0;
        this._fogMask.y = 0;
        this._fogSetup = true;
    }
};