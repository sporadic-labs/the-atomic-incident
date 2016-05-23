module.exports = Bullet;

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

function Bullet(game, x, y, parentGroup, angle, enemies) {
    Phaser.Sprite.call(this, game, x, y, "assets", "bullet");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._enemies = enemies;
    this._speed = 300;
    this._range = 500;
    this._initialPos = this.position.clone();

    // Rotate bullet to face in the right direction. The bullet image is saved
    // facing up (90 degrees), so we need to offset the angle
    this.rotation = angle + Math.PI / 2; // Radians
    
    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);
}

Bullet.prototype.update = function () {
    this.game.physics.arcade.overlap(this, this._enemies,
        this._onCollideWithEnemy, null, this);
    if (this.position.distance(this._initialPos) > this._range) {
        this.destroy();
    }
};

Bullet.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.destroy();
};