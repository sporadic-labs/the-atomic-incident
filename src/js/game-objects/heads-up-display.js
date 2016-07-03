module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);
HeadsUpDisplay.prototype.constructor = HeadsUpDisplay;

function HeadsUpDisplay(game, parentGroup, scoreKeeper, comboTracker) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreKeeper = scoreKeeper;
    this._player = this.game.globals.player;

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
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreText.setText("Score: " + this._scoreKeeper.getScore());
    this._comboText.setText("Combo: " + this._comboTracker.getCombo());
    this._comboText.setText("Combo: " + this._player.getCombo());
};