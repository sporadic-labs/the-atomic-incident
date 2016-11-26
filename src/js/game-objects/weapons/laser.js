module.exports = Laser;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Laser.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: true,
    rotateOnSetup: true,
    canBounce: false,
};

function Laser(game, parentGroup, player) {
    BaseWeapon.call(this, game, parentGroup, "Laser", player);
    this.initAmmo(120);
    this.initCooldown(160, 500);
    this.tracker = null;
}

Laser.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        var spacing = 0.16 * this._player.width;
        var spacing2 = 0.36 * this._player.width;
        var a = this._createProjectile(angle, 48, 0);
        var b = this._createProjectile(angle, 16, spacing2);
        var c = this._createProjectile(angle, 16, -spacing2);
        var d = this._createProjectile(angle, 24, spacing);
        var e = this._createProjectile(angle, 24, -spacing);
        this.tracker = new Tracker(this.game, a.position.x, a.position.y,
            [a, b, c, d, e]);
        this.incrementAmmo(-5);
        this._startCooldown(this._cooldownTime);
    }
};

Laser.prototype._createProjectile = function (angle, playerDistance, 
    perpendicularOffset) {
    var perpAngle = angle - (Math.PI / 2);
    var x = this._player.x + (playerDistance * Math.cos(angle)) - 
        (perpendicularOffset * Math.cos(perpAngle));
    var y = this._player.y + (playerDistance * Math.sin(angle)) - 
        (perpendicularOffset * Math.sin(perpAngle));    
    var p = new Projectile(this.game, x, y, "assets", "weapons/laser-01", this,
        this._player, 7, angle, 640, 320, projectileOptions);
    p.scale.setTo(0.72, 0.72);
    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
    return p;
};







// Tracker for the laser
Tracker.prototype = Object.create(Phaser.Sprite.prototype);

/**
 * @param {Projectile} bullets - Array of bullets associated with a specific tracker.
 */
function Tracker(game, x, y, bullets) {
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    this.scale.setTo(1.2, 1.2);

    this.bullets = bullets

    this.game.physics.arcade.enable(this);
}

Tracker.prototype.update = function() {
    console.log('this.is happening at least');
    // Set tracker position to bullet[0] position
    this.position.x = this.bullets[0].position.x;
    this.position.y = this.bullets[0].position.y;

    // Collisions with enemies
    this.game.physics.arcade.collide(this, this.game.globals.groups.enemies,
        this._onCollideWithEnemy, this);
}

Tracker.prototype._onCollideWithEnemy = function (self, enemy) {
    console.log('collide!');
    for (var i = 0; i < this.bullets.length; i++) {
        this.bullets[0].trackTarget(enemy);
    }
    this.destroy();
};
Tracker.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
