module.exports = Explosive;

var BaseWeapon = require("./base-weapon.js");

Explosive.prototype = Object.create(BaseWeapon.prototype);

function Explosive(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Explosive", player);
    this.initAmmo(30);
    this.initCooldown(150);
}

Explosive.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this._createProjectile(x, y, angle);

        this.incrementAmmo(-1);

        this._startCooldown(this._cooldownTime);
    }
};

Explosive.prototype.specialFire = function () {
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
        // create 8 bullets evenly distributed in a circle
        for (var i=0; i<=7; i++) {
            // Start bullet in a position along that trajectory, but in front
            // of the player
            var angle = (i*(Math.PI/4));
            var x = this._player.position.x + (0.75 * this._player.width) * 
                Math.cos(angle);
            var y = this._player.position.y + (0.75 * this._player.width) * 
                Math.sin(angle);
            this._createProjectile(x, y, angle);
        }

        this.incrementAmmo(-8);

        this._startCooldown(this._specialCooldownTime);
    }
};

Explosive.prototype._createProjectile = function (x, y, angle) {
    new BaseProjectile(this.game, x, y, this, this._player, angle);
};


var SpriteUtils = require("../../helpers/sprite-utilities.js");

BaseProjectile.prototype = Object.create(Phaser.Sprite.prototype);

function BaseProjectile(game, x, y, parentGroup, player, angle) {
    Phaser.Sprite.call(this, game, x, y);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._graphics = game.make.graphics(0, 0);
    this.addChild(this._graphics);

    // Draw circle
    this._graphics.beginFill(0x000000);
    this._graphics.drawCircle(0, 0, 10);
    this._graphics.endFill();

    this._timer = game.time.create(false);
    this._timer.start();

    this._hasExploded = false;
    this._damage = 100;
    this._range = 400;
    this._speed = 200;

    this._player = player;
    this._enemies = game.globals.groups.enemies;

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this, 5);
}

BaseProjectile.prototype.update = function() {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer, 
        this._onCollideWithMap);
}

BaseProjectile.prototype.explode = function () {    
    this._hasExploded = true;
    // Switch to explosion circle SAT body 
    this.game.globals.plugins.satBody.removeBody(this.satBody);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this, 
        this._range / 2);
    // Stop moving
    this.body.velocity.set(0);
    // Draw explosion circle
    this._graphics.clear();
    this._graphics.beginFill(0x000000, 0.5);
    this._graphics.drawCircle(0, 0, this._range);
    this._graphics.endFill();
    // Check explosion overlap
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, this._onExplodeEnemy,
        this);
    // Scheduled destruction slightly in the future
    this._timer.add(100, this.destroy, this);
};

BaseProjectile.prototype.destroy = function () {
    this._graphics.destroy();
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

BaseProjectile.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap for the non-exploded projectile
    if (!this._hasExploded) {
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
    // If projectile has collided with an enemy, or is out of range, remove it
    if ((this._isDestructable && this._remove)) {
        this.destroy();
    }
};

BaseProjectile.prototype._onCollideWithMap = function (self, map) {
    if (self._isDestructable) {
        self._remove = true;
    }
    self.explode();
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    self.explode();
};

BaseProjectile.prototype._onExplodeEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (self._isDestructable) self._remove = true;
    self.explode();
};