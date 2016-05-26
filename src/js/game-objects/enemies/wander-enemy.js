module.exports = WanderEnemy;

var BaseEnemy = require("./base-enemy.js");

var ANIM_NAMES = {
    MOVE: "move"
};

WanderEnemy.prototype = Object.create(BaseEnemy.prototype);
WanderEnemy.prototype.constructor = WanderEnemy;

function WanderEnemy(game, x, y, parentGroup, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy2/move-01", parentGroup,
        target, scoreSignal, 1, { maxSpeed: 140 });
    
    this._applyRandomLightnessTint(0.33, 1, 0.5);

    // Setup animations
    var moveFrames = Phaser.Animation.generateFrameNames("enemy2/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.MOVE);

    // Variables for random movement toward player
    var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/2) * 
        this.game.rnd.sign();
    this._angle = this.position.angle(this._target.position) + rndAngle;
    this._moveStart = this.game.time.now;
    this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    this._speed = this.game.rnd.integerInRange(100, 140);
}

WanderEnemy.prototype.update = function () {
    if ((this.game.time.now - this._moveStart) > this._moveDelay) {
        // when _moveDelay time has passed, generate new values for the 
        // enemies movement
        var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/2) * 
            this.game.rnd.sign();
        this._angle = this.position.angle(this._target.position) + rndAngle;

        this._speed = this.game.rnd.integerInRange(100, 140);
        this._moveStart = this.game.time.now;
        this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    }

    this.body.velocity.x = this._speed * Math.cos(this._angle);
    this.body.velocity.y = this._speed * Math.sin(this._angle);
};
