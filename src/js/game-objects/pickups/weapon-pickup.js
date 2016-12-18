module.exports = WeaponPickup;

var BasePickup = require("./base-pickup.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

var ANIM_NAMES = {
    IDLE: "idle"
};

WeaponPickup.prototype = Object.create(BasePickup.prototype);

function WeaponPickup(game, x, y, type) {
    var pickups = game.globals.groups.pickups;
    BasePickup.call(this, game, x, y, "assets", "pickups/box-01", pickups,
        "weapon", 0);

    this.type = type;
    this.ammoAmount = 0;
    if (this.type === "weapon-sword") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.98, 1, 0.6);
    } else if (this.type === "weapon-scattershot") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.67, 1, 0.6);
    } else if (this.type === "weapon-flamethrower") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.16, 0.86, 0.6);
    } else if (this.type === "weapon-machine-gun") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.45, 1, 0.46);
    } else if (this.type === "weapon-laser") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.22, 0.7, 0.3);
    } else if (this.type === "weapon-beam") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.54, 1, 0.6);
    } else if (this.type === "weapon-arrow") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.16, 0.42, 1.0);
    } else if (this.type === "explosive") {
        this.ammoAmount = 200;
        spriteUtils.applyRandomLightnessTint(this, 0.16, 0.95, 1.0);
    }

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("pickups/box-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 4, true);
    this.animations.play(ANIM_NAMES.IDLE);
}
