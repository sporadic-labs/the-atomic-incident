module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this.game = game;
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;
    this.fixedToCamera = true;

    new HealthBar(game, 20, 15, this);

    this._scoreText = game.make.text(this.game.width / 2, 34, "", {
        font: "30px 'Alfa Slab One'", fill: "#ffd800", align: "center"
    });
    this._scoreText.anchor.setTo(0.5);
    this.add(this._scoreText);
    // this._waveNum = game.make.text(30, 100, "Wave: 0", textStyle);
    // this.add(this._waveNum);
    this._debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
        font: "18px 'Alfa Slab One'", fill: "#9C9C9C", align: "left"
    });
    this._debugText.anchor.set(0, 1);
    this.add(this._debugText);
}

HeadsUpDisplay.prototype.update = function () {
    // this._waveNum.setText("Wave: " + this.game.globals.waveNum);
    this._scoreText.setText(this.game.globals.scoreKeeper.getScore());
    Phaser.Group.prototype.update.apply(this, arguments);
};


// Health bar helper class
function HealthBar(game, x, y, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "health-bar");
    this.x = x;
    this.y = y; 
    this._player = this.game.globals.player;
    this._fullHeartName = "hud/heart";
    this._emptyHeartName = "hud/heart-open";

    this._hearts = [
        game.make.image(0, 0, "assets", this._fullHeartName),
        game.make.image(30, 0, "assets", this._fullHeartName),
        game.make.image(60, 0, "assets", this._fullHeartName)
    ];
    for (var i = 0; i < this._hearts.length; i++) this.add(this._hearts[i]);
}

HealthBar.prototype = Object.create(Phaser.Group.prototype);

HealthBar.prototype.update = function () {
    var numHearts = this._player.hearts;
    for (var i = 0; i < this._hearts.length; i++) {
        if (i < numHearts) this._hearts[i].frameName = this._fullHeartName;
        else this._hearts[i].frameName = this._emptyHeartName;
    }
};