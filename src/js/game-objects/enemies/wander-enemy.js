module.exports = WanderEnemy;

var ANIM_NAMES = {
    MOVE: "move"
};

// Prototype chain - inherits from Sprite
WanderEnemy.prototype = Object.create(Phaser.Sprite.prototype);
WanderEnemy.prototype.constructor = WanderEnemy;

function WanderEnemy(game, x, y, parentGroup, target, signal) {
    Phaser.Sprite.call(this, game, x, y, "assets", "enemy2/move-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._signal = signal;
    
    // Give the sprite a random tint
    var randLightness = this.game.rnd.realInRange(0.4, 0.6);
    var rgb = Phaser.Color.HSLtoRGB(0.33, 1, randLightness);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    // Setup animations
    var moveFrames = Phaser.Animation.generateFrameNames("enemy2/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.MOVE);

    // variables for random movement toward player
    this._target = target;
    var plusOrMinus = this.game.rnd.integerInRange(0, 1);
    plusOrMinus === 0 ? plusOrMinus = -1 : plusOrMinus = 1;
    var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/2) * plusOrMinus;
    this._angle = this.position.angle(this._target.position) + rndAngle;
    this._moveStart = this.game.time.now;
    this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    this._speed = this.game.rnd.integerInRange(100, 140);

    // Configure player physics
    this._maxSpeed = 140;
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
WanderEnemy.prototype.preUpdate = function () {
    if ((this.game.time.now - this._moveStart) > this._moveDelay) {
        // when _moveDelay time has passed, generate new values for the 
        // enemies movement
        var plusOrMinus = this.game.rnd.integerInRange(0, 1);
        plusOrMinus === 0 ? plusOrMinus = -1 : plusOrMinus = 1;

        var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/2) * plusOrMinus;
        this._angle = this.position.angle(this._target.position) + rndAngle;

        this._speed = this.game.rnd.integerInRange(100, 140);
        this._moveStart = this.game.time.now;
        this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    }

    this.body.velocity.x = this._speed * Math.cos(this._angle);
    this.body.velocity.y = this._speed * Math.sin(this._angle);

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};

WanderEnemy.prototype.deathCry = function () {
    this._signal.dispatch();
};
