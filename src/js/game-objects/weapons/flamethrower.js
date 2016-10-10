module.exports = Flamethrower;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Flamethrower.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
    hiddenOnSetup: false,
    canBurn: true,
    decayRate: 0.965,
    grow: true,
};

function Flamethrower(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Flamethrower", player);
    this.initAmmo(320);
    this.initCooldown(12);
}

Flamethrower.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {

        // Find trajectory
        // randomize the trajectory of each flame
        var angleToPlayer = this._player.position.angle(targetPos); // Rads
        var mod = (this.game.rnd.integerInRange(0, 15) * (Math.PI / 180)) *
                  this.game.rnd.sign();
        var angle = angleToPlayer + mod;
        var speed = this.game.rnd.integerInRange(164,184)
        var range = this.game.rnd.integerInRange(64,72)
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle, speed, range);
        this._startCooldown(this._cooldownTime);
    }
};

Flamethrower.prototype._createProjectile = function (x, y, angle, speed, range) {
    var p = new Projectile(this.game, x, y, "assets", `weapons/e-burst-01`, this, 
        this._player, 100, angle, speed, range, projectileOptions);
    p.rotation += 135;
    // // Randomize the color of each flame.
    var g = this.game.rnd.integerInRange(0, 255);
    p.tint = Phaser.Color.getColor(240, g, 24);
};