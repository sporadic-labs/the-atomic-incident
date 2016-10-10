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
        var range = this.game.rnd.integerInRange(64,74)
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
    // // The random hue for Red, Yellow, Orange is in the 0-10 and 90-100 range.
    // // A use the .sign() method to figure out if we are going
    // // high or low in the range.
    // var hMod = this.game.rnd.sign() > 0 ? 1 : 0;
    // var h = (this.game.rnd.integerInRange(0, 6) + (94 * hMod)) / 100;
    // var s = this.game.rnd.integerInRange(90, 100) / 100;
    // var l = this.game.rnd.integerInRange(45, 80) / 100;
    // var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    // p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    // Randomize the rgb tint
    var g = this.game.rnd.integerInRange(0, 255);
    p.tint = Phaser.Color.getColor(240, g, 24);
};