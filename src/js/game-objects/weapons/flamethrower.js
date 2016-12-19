module.exports = Flamethrower;

var BaseWeapon = require("./base-weapon.js");
var Spray = require("./base-spray.js");

Flamethrower.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    rotateOnSetup: true,
    canBurn: true,
    speedModifier: 0.976,
    sizeModifier: 1.018,
    initialSize: 0.24,
    maxSize: 0.86,
};

function Flamethrower(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Flamethrower", player);
    this.initAmmo(1000);
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
        var life = this.game.rnd.integerInRange(64,72)
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this.incrementAmmo(-1);

        this._createProjectile(x, y, angle, speed, life);
        this._startCooldown(this._cooldownTime);
    }
};

Flamethrower.prototype._createProjectile = function (x, y, angle, speed, 
        life) {
    var p = new Spray(this.game, x, y, "assets", "weapons/e-burst-01", 
        this, this._player, 9, angle, speed, life, projectileOptions);
    p.rotation += 135;
    // // Randomize the color of each flame.
    var g = this.game.rnd.integerInRange(0, 255);
    p.tint = Phaser.Color.getColor(240, g, 24);
};