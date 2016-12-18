module.exports = Scattershot;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Scattershot.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Scattershot(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Scattershot", player);
    this.initAmmo(64);
    this.initCooldown(600, 700);
}

Scattershot.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var pelletNum = this.game.rnd.integerInRange(16, 24);

        // randomize the trajectory of every bullet in the shotgun blast
        for (var i=0; i<pelletNum; i++) {
            var angleToPlayer = this._player.position.angle(targetPos); // Rads
            var mod = (this.game.rnd.integerInRange(0, 30) * (Math.PI / 180)) *
                      this.game.rnd.sign();
            var angle = angleToPlayer + mod;
            var speed = this.game.rnd.integerInRange(364,376)
            var range = this.game.rnd.integerInRange(48,96)
            var perpendicularOffset = this.game.rnd.integerInRange(-5,5)
            this._createProjectile(angle, 24, perpendicularOffset, speed, 
                range);
        }

        this.incrementAmmo(-1);

        this._startCooldown(this._cooldownTime);
    }
};

Scattershot.prototype._createProjectile = function (angle, playerDistance, 
    perpendicularOffset, speed, range) {
    var perpAngle = angle - (Math.PI / 2);
    var x = this._player.x + (playerDistance * Math.cos(angle)) - 
        (perpendicularOffset * Math.cos(perpAngle));
    var y = this._player.y + (playerDistance * Math.sin(angle)) - 
        (perpendicularOffset * Math.sin(perpAngle));
    // shotgun blast is made up of a bunch of slugs at half size.
    var p = new Projectile(this.game, x, y, "assets", "weapons/slug", this,
        this._player, 16, angle, speed, range, projectileOptions);
    p.scale.setTo(0.5, 0.5);
    var rgb = Phaser.Color.HSLtoRGB(0.75, 0.36, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};