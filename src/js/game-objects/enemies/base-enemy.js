module.exports = BaseEnemy;

// Prototype chain - inherits from Sprite
BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BaseEnemy.prototype.constructor = BaseEnemy;

function BaseEnemy(game, x, y, parentGroup, target, scoreSignal) {
    Phaser.Sprite.call(this, game, x, y);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._scoreSignal = scoreSignal;
    this._target = target;
    this._pointsValue = 1;

    // Configure player physics
    this._maxSpeed = 200;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.drag.set(this._maxDrag, this._maxDrag);
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

BaseEnemy.prototype.updateScore = function () {
    this._scoreSignal.dispatch(this._pointsValue);
};
