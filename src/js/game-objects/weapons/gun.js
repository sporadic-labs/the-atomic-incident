module.exports = Gun;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("../projectiles/base-projectile.js");

Gun.prototype = Object.create(BaseWeapon.prototype);
Gun.prototype.constructor = Gun;

function Gun(game, parentGroup, player, enemies, cooldownTime, comboTracker) {
    BaseWeapon.call(this, game, parentGroup, "Gun", player, enemies, 
        cooldownTime, comboTracker);
}

Gun.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var x = this._player.position.x + (0.75 * this._player.width) 
            * Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) 
            * Math.sin(angle);
        this._createProjectile(x, y, angle);
        this._startCooldown();
    }
};

Gun.prototype._createProjectile = function (x, y, angle) {
    new Projectile(this.game, x, y, "assets", "weapons/slug", this, angle, 300,
        500, this._enemies, this._comboTracker);
};