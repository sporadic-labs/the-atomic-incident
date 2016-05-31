module.exports = DashEnemy;

var BaseEnemy = require("./base-enemy.js");

var ANIM_NAMES = {
    MOVE: "move",
    ATTACK: "attack",
    AIM: "aim"
};

var MOVE_STATES = {
    IDLE: "idle",
    AIM: "aim",
    DASH: "dash"
};

DashEnemy.prototype = Object.create(BaseEnemy.prototype);
DashEnemy.prototype.constructor = DashEnemy;

function DashEnemy(game, x, y, parentGroup, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy03/move-01", parentGroup,
        target, scoreSignal, 1);
    // this.scale.setTo(0.5);
    
    this._applyRandomLightnessTint(0.33, 1, 0.5);

    // Setup animations
    var moveFrames = Phaser.Animation.generateFrameNames("enemy03/move-", 1, 4, 
        "", 2);
    var attackFrames = Phaser.Animation.generateFrameNames("enemy03/attack-", 1,
        4, "", 2);
    var aimFrames = Phaser.Animation.generateFrameNames("enemy03/aim-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.add(ANIM_NAMES.ATTACK, attackFrames, 16, true);
    this.animations.add(ANIM_NAMES.AIM, aimFrames, 10, true);
    this.animations.play(ANIM_NAMES.MOVE);

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = 2000 + this.game.rnd.integerInRange(0, 1000); // ms

    this._moveState = MOVE_STATES.IDLE;
    this._changeState = true;
    this._maxSpeed = 200;
    this._maxAcceleration = 5000;

    // Variables for random movement toward player
    this._dist = this.game.rnd.realInRange(1.0, 2.0);
    this._angle = this.game.rnd.realInRange(0.0, 1.0) * (2*Math.PI);
}

DashEnemy.prototype.preUpdate = function() {
    this.body.velocity.set(0);

    if (this._moveState === MOVE_STATES.IDLE && this._changeState) {
        this._dist = this.game.rnd.realInRange(1.0, 2.0);
        this._angle = this.game.rnd.realInRange(0.0, 1.0) * (2*Math.PI);
        this.animations.play(ANIM_NAMES.MOVE);
    } else if (this._moveState === MOVE_STATES.AIM && this._changeState) {
        this._dist = 0.0;
        this._angle = 0.0;
        this.animations.play(ANIM_NAMES.AIM);
    } else if (this._moveState === MOVE_STATES.DASH) {
        this._dist = this.position.distance(this._target.position);
        this._angle = this.position.angle(this._target.position);
        this.animations.play(ANIM_NAMES.ATTACK);
    }

    var targetSpeed = this._dist / this.game.time.physicsElapsed;
    var magnitude = Math.min(this._maxSpeed, targetSpeed);
    this.body.velocity.x = magnitude * Math.cos(this._angle);
    this.body.velocity.y = magnitude * Math.sin(this._angle);

    this._startCooldown();

    return Phaser.Sprite.prototype.preUpdate.call(this);
};

DashEnemy.prototype._startCooldown = function() {
    if (!this._changeState) return;
    this._changeState = false;
    this._cooldownTimer.add(this._cooldownTime, function () {
        this._nextState();
        this._changeState = true;
    }, this);
};

DashEnemy.prototype._nextState = function() {
    switch (this._moveState) {
        case MOVE_STATES.IDLE:
            this._cooldownTime = 500 + this.game.rnd.integerInRange(0, 500);
            this._moveState = MOVE_STATES.AIM;
            break;
        case MOVE_STATES.AIM:
            this._cooldownTime = 4000 + this.game.rnd.integerInRange(0, 2000);
            this._moveState = MOVE_STATES.DASH;
            break;
        case MOVE_STATES.DASH:
            this._cooldownTime = 2000 + this.game.rnd.integerInRange(0, 1000);
            this._moveState = MOVE_STATES.IDLE;
            break;
    }
};

DashEnemy.prototype.destroy = function() {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.call(this);
};