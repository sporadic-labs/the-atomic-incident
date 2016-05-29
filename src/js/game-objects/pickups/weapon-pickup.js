module.exports = WeaponPickup;

var BasePickup = require("./base-pickup.js");

var ANIM_NAMES = {
    IDLE: "idle"
};

WeaponPickup.prototype = Object.create(BasePickup.prototype);
WeaponPickup.prototype.constructor = WeaponPickup;

function WeaponPickup(game, x, y, parentGroup, type, scoreSignal) {
    BasePickup.call(this, game, x, y, "assets", "pickups/box-01", parentGroup,
        "weapon", scoreSignal, 0);

    this.type = type;
    if (this.type === "gun") {
        this._applyRandomLightnessTint(0.98, 1, 0.6);
    } else if (this.type === "laser") {
        this._applyRandomLightnessTint(0.67, 1, 0.6);
    } else if (this.type === "sword") {
        this._applyRandomLightnessTint(0.16, 1, 0.6);
    }

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("pickups/box-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 4, true);
    this.animations.play(ANIM_NAMES.IDLE);
}
