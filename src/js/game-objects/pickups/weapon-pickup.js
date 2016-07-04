module.exports = WeaponPickup;

var BasePickup = require("./base-pickup.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

var ANIM_NAMES = {
    IDLE: "idle"
};

WeaponPickup.prototype = Object.create(BasePickup.prototype);

function WeaponPickup(game, x, y, parentGroup, type) {
    BasePickup.call(this, game, x, y, "assets", "pickups/box-01", parentGroup,
        "weapon", 0);

    this.type = type;
    if (this.type === "gun") {
        spriteUtils.applyRandomLightnessTint(this, 0.98, 1, 0.6);
    } else if (this.type === "laser") {
        spriteUtils.applyRandomLightnessTint(this, 0.67, 1, 0.6);
    } else if (this.type === "sword") {
        spriteUtils.applyRandomLightnessTint(this, 0.16, 1, 0.6);
    }

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("pickups/box-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 4, true);
    this.animations.play(ANIM_NAMES.IDLE);
}
