module.exports = Fire;

var utils = require("../../helpers/utilities.js");

Fire.prototype = Object.create(Phaser.Sprite.prototype);

function Fire(game, x, y, key, frame, parentGroup, category, pointValue) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._category = category;
    this._initialPos = this.position.clone();
    this._pointValue = utils.default(pointValue, 0);

    // Configure physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

Fire.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
