module.exports = BaseEnemy;

var utils = require("../../helpers/utilities.js");

// Prototype chain - inherits from Sprite
BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BaseEnemy.prototype.constructor = BaseEnemy;

function BaseEnemy(game, x, y, key, frame, parentGroup, target, scoreSignal, 
    pointValue, physicsConfig) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._target = target;
    this._scoreSignal = scoreSignal;
    this._pointValue = utils.default(pointValue, 1);

    // Configure player physics
    physicsConfig = utils.default(physicsConfig, {});
    this._maxSpeed = utils.default(physicsConfig.maxSpeed, 100);
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = false;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

BaseEnemy.prototype._applyRandomLightnessTint = function (h, s, l) {
    l += this.game.rnd.realInRange(-0.1, 0.1);
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};

BaseEnemy.prototype.killByPlayer = function () {
    this._scoreSignal.dispatch(this._pointValue);
    this.destroy();
};
