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
};

function Flamethrower(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Flamethrower", player);
    this.initAmmo(120);
    this.initCooldown(96);
}

Flamethrower.prototype.fire = function (targetPos) {
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

Flamethrower.prototype._createProjectile = function (x, y, angle) {
    var p = new Projectile(this.game, x, y, "assets", "weapons/death-beam", this, 
        this._player, 100, angle, 120, 160, projectileOptions);

    // Randomize the color of each flame.
    // The random hue for Red, Yellow, Orange is in the 0-10 and 90-100 range.
    // A use the .sign() method to figure out if we are going
    // high or low in the range.
    var hMod = this.game.rnd.sign() > 0 ? 1 : 0;
    var h = (this.game.rnd.integerInRange(2, 8) + (95 * hMod)) / 100;
    var s = this.game.rnd.integerInRange(90, 100) / 100;
    var l = this.game.rnd.integerInRange(25, 60) / 100;
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};