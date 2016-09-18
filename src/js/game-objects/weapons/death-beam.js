module.exports = DeathBeam;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

DeathBeam.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
    hiddenOnSetup: false
};

function DeathBeam(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "DeathBeam", player);
    this.initAmmo(200);
    this.initCooldown(50);
}

DeathBeam.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

DeathBeam.prototype._createProjectile = function (x, y, angle) {
    new Projectile(this.game, x, y, "assets", "weapons/death-beam", this, 
        this._player, 100, angle, 300, 500, projectileOptions);
};