module.exports = Laser;

var Bolt = require("../projectiles/bolt.js");

Laser.prototype = Object.create(Phaser.Group.prototype);
Laser.prototype.constructor = Laser;

function Laser(game, parentGroup, player, enemies) {
    Phaser.Group.call(this, game, parentGroup, "bullet");

    this._player = player;
    this._enemies = enemies;

    // Set up a timer that doesn't autodestroy itself
    this._bulletCooldownTimer = this.game.time.create(false);
    this._bulletCooldownTimer.start();
    this._bulletCooldownTime = 150; // Milliseconds 
    this._ableToFire = true;

    // Clean up
    this.onDestroy.add(this._onDestroy, this);
}

Laser.prototype.fire = function (targetPos) {
    if (this._ableToFire) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var bulletPosR = this._player.position.clone();
        var bulletPosL = this._player.position.clone();
        bulletPosR.x += (0.75 * this._player.width) * Math.cos(angle) + (10 * Math.sin(angle));
        bulletPosR.y += (0.75 * this._player.width) * Math.sin(angle) + (10 * Math.cos(angle));
        bulletPosL.x += (0.75 * this._player.width) * Math.cos(angle) - (10 * Math.sin(angle));
        bulletPosL.y += (0.75 * this._player.width) * Math.sin(angle) - (10 * Math.cos(angle));
        new Bolt(this.game, bulletPosR.x, bulletPosR.y, this, angle, 
            this._enemies);
        new Bolt(this.game, bulletPosL.x, bulletPosL.y, this, angle, 
            this._enemies);
        this._startCooldown();
    }
};

Laser.prototype._startCooldown = function () {
    this._ableToFire = false;
    this._bulletCooldownTimer.add(this._bulletCooldownTime, function () {
        this._ableToFire = true;
    }, this);
};

Laser.prototype._onDestroy = function () {
    // Since the timer doesn't destroy itself, we have to schedule its
    // destruction or it will stick around after the Laser is destroyed.
    this._bulletCooldownTimer.destroy();
};