module.exports = BaseProjectile;

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);
BaseProjectile.prototype.constructor = BaseProjectile;

function BaseProjectile(game, x, y, key, frame, parentGroup, angle, speed, 
    range, enemies, comboTracker) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._enemies = enemies;
    this._speed = speed;
    this._range = range;
    this._initialPos = this.position.clone();
    this._comboTracker = comboTracker;

    this._remove = false; // check if BaseProjectile should be removed?

    // Rotate projectile to face in the right direction. Sprites are saved
    // facing up (90 degrees), so we need to offset the angle
    this.rotation = angle + Math.PI / 2; // Radians
    
    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);
}

BaseProjectile.prototype._checkOverlapWithGroup = function (group, callback, 
    callbackContext) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            this._checkOverlapWithGroup(child, callback, callbackContext);
        } else {
            this.game.physics.arcade.overlap(this, child, callback, null, 
                callbackContext);
        }
    }
};

BaseProjectile.prototype.update = function () {
    this._checkOverlapWithGroup(this._enemies, this._onCollideWithEnemy, this);
    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) > this._range) || 
        this._remove) {
        this.destroy();
    }
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.killByPlayer();
    this._comboTracker.incrementCombo(1);
    this._remove = true;
};