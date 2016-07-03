module.exports = BaseProjectile;

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);

// options is an object containing some optional settings for the
// base projectile class
// - isDestructible - bool
// - rotateOnSetup - bool
// - canBounce - bool
// - hiddenOnSetup
function BaseProjectile(game, x, y, key, frame, parentGroup, player, angle, 
    speed, range, options) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._speed = speed;
    this._range = range;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseProjectile should be removed?

    // projectile options
    if (options.isDestructible !== null)
        this._isDestructable = options.isDestructible;
    else
        this._isDestructable = true;
    if (options.rotateOnSetup !== null)
        this._rotateOnSetup = options.rotateOnSetup;
    else
        this._rotateOnSetup = true;
    if (options.canBounce !== null)
        this._canBounce = options.canBounce;
    else
        this._canBounce = true;
    if (options.hiddenOnSetup !== null)
        this._hiddenOnSetup = options.hiddenOnSetup;
    else
        this._hiddenOnSetup = false;

    // If rotateOnSetup option is true, rotate projectile to face in the
    // right direction. Sprites are saved facing up (90 degrees), so we
    // need to offset the angle
    if (this._rotateOnSetup)
        this.rotation = angle + (Math.PI / 2); // Radians
    else
        this.rotation = angle;
    // If hiddenOnSetup option is true, hide the object
    if (this._hiddenOnSetup)
        this.visible = false;
    
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
    if ((this.position.distance(this._initialPos) >
        this._range) || (this._isDestructable && this._remove)) {
        this.destroy();
    }
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.killByPlayer();
    this._player.incrementCombo(1);

    if (this._isDestructable) {
        this._remove = true;
    }
};