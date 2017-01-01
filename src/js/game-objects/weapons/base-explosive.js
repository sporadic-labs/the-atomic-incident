module.exports = BaseExplosive;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

BaseExplosive.prototype = Object.create(Phaser.Sprite.prototype);

// Set Range & Life to -1 if you don't care about these options
// options is an object containing some optional settings for the
// base projectile class
// - isDestructible - bool
// - rotateOnSetup - bool
// - speedModifier - range (0 - 1.0)
function BaseExplosive(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed, range, life, options) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._graphics = game.make.graphics(0, 0);
    this.addChild(this._graphics);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._damage = damage;
    this._speed = speed;
    this._range = range;
    this._life = life;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseProjectile should be removed?

    // projectile options
    if (options !== undefined && options.isDestructible !== undefined)
        this._isDestructable = options.isDestructible;
    else this._isDestructable = true;
    if (options !== undefined && options.rotateOnSetup !== undefined)
        this._rotateOnSetup = options.rotateOnSetup;
    else this._rotateOnSetup = true;
    if (options !== undefined && options.speedModifier !== undefined)
        this._speedModifier = options.speedModifier;
    else this._speedModifier = 1.0;
    // If rotateOnSetup option is true, rotate projectile to face in the
    // right direction. Sprites are saved facing up (90 degrees), so we
    // need to offset the angle
    if (this._rotateOnSetup)
        this.rotation = angle + (Math.PI / 2); // Radians
    else
        this.rotation = angle;

    // Store variable for explosion
    this._explosionRadius = 80;

    this._timer = game.time.create(false);
    this._timer.start();

    this._hasExploded = false;

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
}

BaseExplosive.prototype.update = function() {
    // Collisions with the tilemap
    SpriteUtils.satSpriteVsTilemap(this, this.game.globals.tileMapLayer, 
        this._onCollideWithMap, this, 6);

    // If there is a speed modifier, apply it.
    if (this._speedModifier !== 1.0) {
        this.body.velocity.x = this.body.velocity.x * this._speedModifier;
        this.body.velocity.y = this.body.velocity.y * this._speedModifier;
    }
}

BaseExplosive.prototype.explode = function () {
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

BaseExplosive.prototype.destroy = function () {
    this._graphics.destroy();
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

BaseExplosive.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap for the non-exploded projectile
    if (!this._hasExploded) {
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }

    // If the time has expired on this explosive, and it hasn't exploded yet, blow up!
    if (this._timer.ms > this._life && this._life > 0 && !this._hasExploded) {
        this.explode();
    }

    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) > this._range &&
         this._range > 0) || (this._isDestructable && this._remove)) {
        this.destroy();
    }
};

// eslint-disable-next-line no-unused-vars
BaseExplosive.prototype._onCollideWithMap = function (self, map) {
    self.explode();
};

// eslint-disable-next-line no-unused-vars
BaseExplosive.prototype._onCollideWithEnemy = function (self, enemy) { 
    self.explode();
};

BaseExplosive.prototype._onExplodeEnemy = function (self, enemy) {
    enemy.takeDamage(this._damage);
};