module.exports = WanderEnemy;

var BaseEnemy = require("./base-enemy.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

var ANIM_NAMES = {
    MOVE: "move"
};

WanderEnemy.prototype = Object.create(BaseEnemy.prototype);

function WanderEnemy(game, x, y, parentGroup) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy02/move-01", 100,
        parentGroup);
    
    spriteUtils.applyRandomLightnessTint(this, 0.33, 1, 0.5);

    // Setup animations
    var moveFrames = Phaser.Animation.generateFrameNames("enemy02/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.MOVE);

    // Variables for random movement toward player
    var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/2) * 
        this.game.rnd.sign();
    this._angle = this.position.angle(this._player.position) + rndAngle;
    this._moveStart = this.game.time.now;
    this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    this._maxSpeed = 140;
    this._speed = this.game.rnd.integerInRange(100, 140);
}

WanderEnemy.prototype.update = function () {
    if ((this.game.time.now - this._moveStart) > this._moveDelay) {
        // when _moveDelay time has passed, generate new values for the 
        // enemies movement
        var rndAngle = this.game.rnd.realInRange(0.0, 1.0) * (Math.PI/8) * 
            this.game.rnd.sign();
        this._angle = this.position.angle(this._player.position) + rndAngle;

        this._speed = this.game.rnd.integerInRange(100, 140);
        this._moveStart = this.game.time.now;
        this._moveDelay = 4000 + this.game.rnd.integerInRange(0, 2000);
    }

    this.body.velocity.x = this._speed * Math.cos(this._angle);
    this.body.velocity.y = this._speed * Math.sin(this._angle);
};
