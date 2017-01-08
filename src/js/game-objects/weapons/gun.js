module.exports = Gun;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");
var BouncingProjectile = require("./bouncing-projectile.js");

Gun.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Gun(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Gun", player);
    this.initAmmo(-1);
    this.initCooldown(320, 480);
}

Gun.prototype.fire = function (targetPos) {
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
        this._startCooldown(this._cooldownTime);
    }
};

Gun.prototype.specialFire = function () {
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

Gun.prototype._createProjectile = function (x, y, angle) {
    // new Projectile(this.game, x, y, "assets", "weapons/slug", this, 
    //     this._player, 100, angle, 300, 200, projectileOptions);
    new BouncingProjectile(this.game, x, y, "assets", "weapons/circle",
        this, this._player, 100, angle, 300, 20);
};