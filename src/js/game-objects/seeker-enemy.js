module.exports = SeekerEnemy;

// Prototype chain - inherits from Sprite
SeekerEnemy.prototype = Object.create(Phaser.Sprite.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy; // Make sure constructor reads properly

function SeekerEnemy(game, x, y, target, parentGroup) {
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.scale.set(0.75);
    this.anchor.set(0.5);
    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    // Give the sprite a random tint
    var randLightness = this.game.rnd.realInRange(0.4, 0.6);
    var rgb = Phaser.Color.HSLtoRGB(0.98, 1, randLightness);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    this._target = target;
    this._visionRadius = 300;

    // Configure player physics
    this._maxSpeed = 200;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setSize(36, 36);
    this.body.drag.set(this._maxDrag, this._maxDrag);
}

/**
 * Override preUpdate to update velocity. Physics updates happen in preUpdate,
 * so if the velocity updates happened AFTER that, the targeting would be off
 * by a frame.
 */
SeekerEnemy.prototype.preUpdate = function () {
    this.body.velocity.set(0);

    // Check if target is within visual range
    var distance = this.position.distance(this._target.position);
    if (distance <= this._visionRadius) {
        // If target is in range, calculate the acceleration based on the 
        // direction this sprite needs to travel to hit the target
        var angle = this.position.angle(this._target.position);
        var targetSpeed = distance / this.game.time.physicsElapsed;
        var magnitude = Math.min(this._maxSpeed, targetSpeed);
        this.body.velocity.x = magnitude * Math.cos(angle);
        this.body.velocity.y = magnitude * Math.sin(angle);
    }

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};