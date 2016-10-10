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

function Laser(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Laser", player);
    this.initAmmo(120);
    this.initCooldown(160, 500);
}

Laser.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        var spacing = 0.16 * this._player.width;
        var spacing2 = 0.36 * this._player.width;
        this._createProjectile(angle, 48, 0);
        this._createProjectile(angle, 16, spacing2);
        this._createProjectile(angle, 16, -spacing2);
        this._createProjectile(angle, 24, spacing);
        this._createProjectile(angle, 24, -spacing);

        this.incrementAmmo(-5);
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
        this._player, 24, angle, 640, 360, projectileOptions);
    p.scale.setTo(0.72, 0.72);
    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};