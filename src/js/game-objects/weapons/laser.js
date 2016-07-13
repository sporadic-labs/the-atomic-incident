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
    this._currentAmmo = 100;
}

Laser.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        var spacing = 0.5 * this._player.width;
        this._createProjectile(angle, 15, 0);
        this._createProjectile(angle, 5, -spacing);
        this._createProjectile(angle, 5, spacing);
        this._startCooldown(this._cooldownTime);
    }
};

Laser.prototype._createProjectile = function (angle, playerDistance, 
    perpendicularOffset) {
    var perpAngle = angle - (Math.PI / 2);
    var x = this._player.x + (playerDistance * Math.cos(angle)) - 
        (perpendicularOffset * Math.cos(perpAngle));
    var y = this._player.y + (playerDistance * Math.sin(angle)) - 
        (perpendicularOffset * Math.sin(perpAngle));    
    var p = new Projectile(this.game, x, y, "assets", "weapons/laser-01", this,
        this._player, 50, angle, 750, 500, projectileOptions);
    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};