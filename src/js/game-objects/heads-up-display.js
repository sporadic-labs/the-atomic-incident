module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);
HeadsUpDisplay.prototype.constructor = HeadsUpDisplay;

function HeadsUpDisplay(game, parentGroup, scoreKeeper) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this._scoreText = game.make.text(400, 500, "Score: 0", { 
        font: "32px Arial", 
        fill: "#000", 
        align: "left" 
    });
    this.add(this._scoreText);
    this._scoreText.fixedToCamera = true;
    this._scoreText.cameraOffset.setTo(36, 24);

    this._scoreKeeper = scoreKeeper;
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreKeeper.text = "Score: " + this._scoreKeeper.getScore();
};