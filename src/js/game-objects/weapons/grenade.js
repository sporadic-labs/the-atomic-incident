module.exports = Grenade;

var BaseWeapon = require("./base-weapon.js");
var BaseExplosive = require("./base-explosive.js");

Grenade.prototype = Object.create(BaseWeapon.prototype);

function Grenade(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Grenade", player);
    this.initAmmo(30);
    this.initCooldown(150);
}

Grenade.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of 
        // the player
        var x = this._player.position.x + (0.75 * this._player.width) * 
            Math.cos(angle);
        var y = this._player.position.y + (0.75 * this._player.width) * 
            Math.sin(angle);

        this._createProjectile(x, y, angle);

        this.incrementAmmo(-1);

        this._startCooldown(this._cooldownTime);
    }
};

Grenade.prototype.specialFire = function () {
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
        // create 8 bullets evenly distributed in a circle
        for (var i=0; i<=7; i++) {
            // Start bullet in a position along that trajectory, but in front
            // of the player
            var angle = (i*(Math.PI/4));
            var x = this._player.position.x + (0.75 * this._player.width) * 
                Math.cos(angle);
            var y = this._player.position.y + (0.75 * this._player.width) * 
                Math.sin(angle);
            this._createProjectile(x, y, angle);
        }

        this.incrementAmmo(-8);

        this._startCooldown(this._specialCooldownTime);
    }
};

Grenade.prototype._createProjectile = function (x, y, angle) {
    new BaseExplosive(this.game, x, y, this, this._player, angle);
};
