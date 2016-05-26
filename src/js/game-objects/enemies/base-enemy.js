module.exports = BaseEnemy;

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
    this._pointValue = (pointValue === undefined) ? pointValue : 1;

    // Configure player physics
    physicsConfig = physicsConfig || {};
    this._maxSpeed = physicsConfig.maxSpeed || 200;
    this._maxDrag = physicsConfig.maxDrag || 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.drag.set(this._maxDrag, this._maxDrag);
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
