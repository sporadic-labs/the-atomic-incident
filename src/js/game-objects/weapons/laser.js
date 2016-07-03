module.exports = Laser;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Laser.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
    hiddenOnSetup: false
};

function Laser(game, parentGroup, player, cooldownTime, specialCooldownTime) {
    BaseWeapon.call(this, game, parentGroup, "Laser", player, cooldownTime, 
        specialCooldownTime);
}

Laser.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var bulletPosR = this._player.position.clone();
        var bulletPosL = this._player.position.clone();
        bulletPosR.x += (0.75 * this._player.width) * Math.cos(angle) +
            (10 * Math.sin(angle));
        bulletPosR.y += (0.75 * this._player.width) * Math.sin(angle) +
            (10 * Math.cos(angle));
        bulletPosL.x += (0.75 * this._player.width) * Math.cos(angle) -
            (10 * Math.sin(angle));
        bulletPosL.y += (0.75 * this._player.width) * Math.sin(angle) -
            (10 * Math.cos(angle));
        this._createProjectile(bulletPosR.x, bulletPosR.y, angle);
        this._createProjectile(bulletPosL.x, bulletPosL.y, angle);
        this._startCooldown();
    }
};

Laser.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/laser-01", this, 
        this._player, angle, 300, 500, projectileOptions);
    var p = new Projectile(this.game, x, y, "assets", "weapons/laser-01", this,
        this._player, 34, angle, 750, 500, projectileOptions);
    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};