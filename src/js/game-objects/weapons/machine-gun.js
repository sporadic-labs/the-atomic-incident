module.exports = MachineGun;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

MachineGun.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function MachineGun(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "MachineGun", player);
    this.initAmmo(400);
    this.initCooldown(52);
}

MachineGun.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.5 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.5 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle);
        this._startCooldown(this._cooldownTime);
    }
};

MachineGun.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/slug", this, 
        this._player, 24, angle, 300, 264, projectileOptions);
    p.scale.setTo(0.72, 0.72);
    // Randomize the color of each flame.
    var r = this.game.rnd.integerInRange(120, 160);
    var g = this.game.rnd.integerInRange(160, 200);
    var b = this.game.rnd.integerInRange(160, 200);
    p.tint = Phaser.Color.getColor(r, g, b);
};