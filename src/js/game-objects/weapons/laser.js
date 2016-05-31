module.exports = Laser;

var BaseWeapon = require("./base-weapon.js");
var Bolt = require("../projectiles/bolt.js");

Laser.prototype = Object.create(BaseWeapon.prototype);
Laser.prototype.constructor = Laser;

function Laser(game, parentGroup, player, enemies, cooldownTime, comboTracker) {    
    BaseWeapon.call(this, game, parentGroup, "Laser", player, enemies, 
        cooldownTime, comboTracker);
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
        new Bolt(this.game, bulletPosR.x, bulletPosR.y, this, angle, 
            this._enemies, this._comboTracker);
        new Bolt(this.game, bulletPosL.x, bulletPosL.y, this, angle, 
            this._enemies, this._comboTracker);
        this._startCooldown();
    }
};