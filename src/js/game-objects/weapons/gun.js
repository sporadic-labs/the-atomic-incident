module.exports = Gun;

var BaseWeapon = require("./base-weapon.js");
var Bullet = require("../projectiles/bullet.js");

Gun.prototype = Object.create(BaseWeapon.prototype);
Gun.prototype.constructor = Gun;

function Gun(game, parentGroup, player, enemies, cooldownTime, specialCooldownTime, comboTracker) {
    BaseWeapon.call(this, game, parentGroup, "Gun", player, enemies, 
        cooldownTime, specialCooldownTime, comboTracker);
}

Gun.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var bulletPos = this._player.position.clone();
        bulletPos.x += (0.75 * this._player.width) * Math.cos(angle);
        bulletPos.y += (0.75 * this._player.width) * Math.sin(angle);
        new Bullet(this.game, bulletPos.x, bulletPos.y, this, angle, 
            this._enemies, this._comboTracker);
        this._startCooldown();
    }
};


Gun.prototype.specialFire = function (targetPos) {
    if (this.isAbleToAttackSpecial()) {
        // create 8 bullets evenly distributed in a circle
        for (var i=0; i<=7; i++) {
            // Start bullet in a position along that trajectory, but in front
            // of the player
            var bulletPos = this._player.position.clone();
            var angle = (i*(Math.PI/4));
            bulletPos.x += (0.75 * this._player.width) * Math.cos(angle);
            bulletPos.y += (0.75 * this._player.width) * Math.sin(angle);
            new Bullet(this.game, bulletPos.x, bulletPos.y, this, angle, 
                this._enemies, this._comboTracker);
            
        }
        this._startSpecialCooldown();
    }
};