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

    this._remove = false; // check if bullet should be removed?

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
    // if bullet has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) > this._range) || 
        this._remove) {
        this.destroy();
    }
};

Bullet.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.deathCry();
    enemy.destroy();
    // set this variable to true if the bullet has collided with an enemy
    // the bullet can then be removed in the update function
    this._remove = true;
};