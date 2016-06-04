module.exports = ScorePickup;

var BasePickup = require("./base-pickup.js");

var ANIM_NAMES = {
    IDLE: "idle"
};

ScorePickup.prototype = Object.create(BasePickup.prototype);
ScorePickup.prototype.constructor = ScorePickup;

function ScorePickup(game, x, y, parentGroup, type, scoreSignal) {
    BasePickup.call(this, game, x, y, "assets", "pickups/diamond-01",
        parentGroup, "score", scoreSignal, 5);

    this.type = type;
    this._applyRandomLightnessTint(0.52, 1, 0.6);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("pickups/diamond-",
        1, 6, "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 4, true);
    this.animations.play(ANIM_NAMES.IDLE);
}
