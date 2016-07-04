module.exports = BaseEnemy;

var utils = require("../../helpers/utilities.js");

BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);

function BaseEnemy(game, x, y, key, frame, parentGroup, pointValue) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = this.game.globals.player;
    this._scoreKeepter = this.game.globals.scoreKeeper;
    this._pointValue = utils.default(pointValue, 1);

    // Configure simple physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = false;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

BaseEnemy.prototype.killByPlayer = function () {
    this._scoreKeepter.incrementScore(this._pointValue);
    this.destroy();
};
