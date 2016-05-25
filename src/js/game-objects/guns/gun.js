module.exports = Gun;

var Bullet = require("../bullets/bullet.js");

Gun.prototype = Object.create(Phaser.Group.prototype);
Gun.prototype.constructor = Gun;

function Gun(game, parentGroup, player, enemies) {
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

Gun.prototype.fire = function (targetPos) {
    if (this._ableToFire) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var bulletPos = this._player.position.clone();
        bulletPos.x += (0.75 * this._player.width) * Math.cos(angle);
        bulletPos.y += (0.75 * this._player.width) * Math.sin(angle);
        new Bullet(this.game, bulletPos.x, bulletPos.y, this, angle, 
            this._enemies);
        this._startCooldown();
    }
};

Gun.prototype._startCooldown = function () {
    this._ableToFire = false;
    this._bulletCooldownTimer.add(this._bulletCooldownTime, function () {
        this._ableToFire = true;
    }, this);
};

Gun.prototype._onDestroy = function () {
    // Since the timer doesn't destroy itself, we have to schedule its
    // destruction or it will stick around after the Gun is destroyed.
    this._bulletCooldownTimer.destroy();
};