module.exports = BaseEnemy;

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

// Prototype chain - inherits from Sprite
BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);
BaseEnemy.prototype.constructor = BaseEnemy;

function BaseEnemy(game, x, y, parentGroup, target, signal) {
    Phaser.Sprite.call(this, game, x, y, "assets", "enemy/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._signal = signal;
    
    // Give the sprite a random tint
    var randLightness = this.game.rnd.realInRange(0.4, 0.6);
    var rgb = Phaser.Color.HSLtoRGB(0.98, 1, randLightness);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("enemy/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("enemy/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.IDLE);

    this._target = target;

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
BaseEnemy.prototype.preUpdate = function () {
    this.animations.play(ANIM_NAMES.IDLE);

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};

BaseEnemy.prototype.deathCry = function () {
    this._signal.dispatch();
};
