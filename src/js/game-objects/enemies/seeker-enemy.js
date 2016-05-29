module.exports = SeekerEnemy;

var BaseEnemy = require("./base-enemy.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

SeekerEnemy.prototype = Object.create(BaseEnemy.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy;

function SeekerEnemy(game, x, y, parentGroup, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        target, scoreSignal, 1);
    
    this._applyRandomLightnessTint(0.98, 1, 0.5);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("enemy01/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("enemy01/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.IDLE);

    this._visionRadius = 300;
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