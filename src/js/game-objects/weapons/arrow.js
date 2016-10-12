module.exports = Arrow;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Arrow.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: true,
    canPierce: true,
};

function Arrow(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Arrow", player);
    this.initAmmo(40);
    this.initCooldown(360);
}

Arrow.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.96 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.96 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

Arrow.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/arrow", this, 
        this._player, 100, angle, 300, 500, projectileOptions);
    p.scale.setTo(1.4, 1.4);
};