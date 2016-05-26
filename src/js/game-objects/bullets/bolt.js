module.exports = Bolt;

Bolt.prototype = Object.create(Phaser.Sprite.prototype);
Bolt.prototype.constructor = Bolt;

function Bolt(game, x, y, parentGroup, angle, enemies) {
    Phaser.Sprite.call(this, game, x, y, "assets", "bullet");
    this.anchor.set(0.5);
    parentGroup.add(this);

    var rgb = Phaser.Color.HSLtoRGB(0.52, 0.5, 0.64);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    this._enemies = enemies;
    this._speed = 300;
    this._range = 500;
    this._initialPos = this.position.clone();

    this._remove = false; // check if Bolt should be removed?

    // Rotate Bolt to face in the right direction. The Bolt image is saved
    // facing up (90 degrees), so we need to offset the angle
    this.rotation = angle + Math.PI / 2; // Radians
    
    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);
}

Bolt.prototype.update = function () {
    this.game.physics.arcade.overlap(this, this._enemies,
        this._onCollideWithEnemy, null, this);
    // if Bolt has collided with an enemy, or is out of range, remove it
    if ((this.position.distance(this._initialPos) > this._range) || 
        this._remove) {
        this.destroy();
    }
};

Bolt.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.deathCry();
    enemy.destroy();
    // set this variable to true if the Bolt has collided with an enemy
    // the Bolt can then be removed in the update function
    this._remove = true;
};