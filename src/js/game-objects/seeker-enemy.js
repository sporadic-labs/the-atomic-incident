module.exports = SeekerEnemy;

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

// Prototype chain - inherits from Sprite
SeekerEnemy.prototype = Object.create(Phaser.Sprite.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy;

function SeekerEnemy(game, x, y, parentGroup, target) {
    // *** REMOVE AND UNCOMMENT BELOW FOR SPRITESHEET
    Phaser.Sprite.call(this, game, x, y, "enemyAnim");
    // Phaser.Sprite.call(this, game, x, y, "assets", "enemy/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);
    
    // Give the sprite a random tint
    var randLightness = this.game.rnd.realInRange(0.4, 0.6);
    var rgb = Phaser.Color.HSLtoRGB(0.98, 1, randLightness);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("enemy/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("enemy/move-", 1, 4, 
        "", 2);
    // *** REMOVE AND UNCOMMENT BELOW FOR SPRITESHEET
    this.animations.add(ANIM_NAMES.IDLE, [0,1,2,3], 10, true);
    this.animations.add(ANIM_NAMES.MOVE, [4,5,6,7], 10, true);
    // this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    // this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.IDLE);

    this._target = target;
    this._visionRadius = 300;

    // Configure player physics
    this._maxSpeed = 200;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.drag.set(this._maxDrag, this._maxDrag);
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
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

    // Check whether enemy is moving, update its animation
    var isIdle;
    if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        isIdle = true;
    } else {
        isIdle = false;
    }

    if (isIdle && this.animations.name !== ANIM_NAMES.IDLE) {
        this.animations.play(ANIM_NAMES.IDLE);
    } else if (!isIdle && this.animations.name !== ANIM_NAMES.MOVE) {
        this.animations.play(ANIM_NAMES.MOVE);
    }

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};