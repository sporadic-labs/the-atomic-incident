module.exports = Rocket;

var BaseWeapon = require("./base-weapon.js");
var ExplosiveProjectile = require("./explosive-projectile.js");

Rocket.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    speedModifier: 1.025,
};

function Rocket(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Rocket", player);
    this.initAmmo(32);
    this.initCooldown(860);
}

Rocket.prototype.fire = function (targetPos) {
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

Rocket.prototype.specialFire = function () {
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

Rocket.prototype._createProjectile = function (x, y, angle) {
    new ExplosiveProjectile(this.game, x, y, "assets", "weapons/slug", this, 
        this._player, 112, angle, 80, 500, -1, projectileOptions);
};