module.exports = ExplosiveProjectile;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var BaseProjectile = require("./base-projectile.js");

ExplosiveProjectile.prototype = Object.create(BaseProjectile.prototype);

function ExplosiveProjectile(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed, range, life, options) {
    // Phaser.Sprite.call(this, game, x, y, key, frame);
    BaseProjectile.call(this, game, x, y, key, frame, parentGroup, player, 
        damage, angle, speed, range, options);

    this._graphics = game.make.graphics(0, 0);
    this.addChild(this._graphics);

    // Store variable for explosion
    this._explosionRadius = 80;

    this._timer = game.time.create(false);
    this._timer.start();

    this._hasExploded = false;
}

ExplosiveProjectile.prototype.explode = function () {
    this._hasExploded = true;
    // Switch to explosion circle SAT body 
    this.game.globals.plugins.satBody.removeBody(this.satBody);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this,
        this._range / 2);
    this.satBody.setCircleRadius(this._explosionRadius);
    // Stop moving
    this.body.velocity.set(0);
    // Draw explosion circle
    this._graphics.clear();
    this._graphics.beginFill(0x000000, 0.5);
    this._graphics.drawCircle(0, 0, this._explosionRadius * 2);
    this._graphics.endFill();
    // Check explosion overlap
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, this._onExplodeEnemy,
        this);
    // Scheduled destruction slightly in the future
    this._timer.add(100, this.destroy, this);
};

ExplosiveProjectile.prototype.destroy = function () {
    this._graphics.destroy();
    this._timer.destroy();
    BaseProjectile.prototype.destroy.apply(this, arguments);
};

ExplosiveProjectile.prototype.postUpdate = function () {
    // Update arcade physics
    BaseProjectile.prototype.postUpdate.apply(this, arguments);
    // Check overlap for the non-exploded projectile
    if (!this._hasExploded) {
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }

    // If the time has expired on this explosive,
    // and it hasn't exploded yet, blow up!
    if (this._timer.ms > this._life && this._life > 0 &&
        !this._hasExploded) {
        this.explode();
    }

    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) > this._range &&
         this._range > 0) || (this._isDestructable && this._remove)) {
        this.destroy();
    }
};

// eslint-disable-next-line no-unused-vars
ExplosiveProjectile.prototype._onCollideWithMap = function (self, map) {
    self.explode();
};

// eslint-disable-next-line no-unused-vars
ExplosiveProjectile.prototype._onCollideWithEnemy = function (self, enemy) { 
    self.explode();
};

ExplosiveProjectile.prototype._onExplodeEnemy = function (self, enemy) {
    enemy.takeDamage(this._damage);
};