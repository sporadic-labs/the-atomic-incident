module.exports = WeaponPickup;

var BasePickup = require("./base-pickup.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

WeaponPickup.prototype = Object.create(BasePickup.prototype);

function WeaponPickup(game, x, y, type) {
    var pickups = game.globals.groups.pickups;
    BasePickup.call(this, game, x, y, "assets", "pickups/box-01", pickups,
        "weapon", 0, 10000);

    // Figure out what type this pickup is supposed to be.
    // Tint the box, and set a label.
    this.type = type;
    this._label;
    if (this.type === "rusty-sword") {
        spriteUtils.applyRandomLightnessTint(this, 0.98, 1, 0.6);
        this._label = game.make.image(0, 0, "assets", "weapons/sword");
        this._label.scale.setTo(0.36, 0.36);
    } else if (this.type === "weapon-scattershot") {
        spriteUtils.applyRandomLightnessTint(this, 0.67, 1, 0.6);
        this._label = game.make.image(0, 0, "assets", "weapons/slug");
        this._label.scale.setTo(0.25, 0.25);
    } else if (this.type === "weapon-flamethrower") {
        spriteUtils.applyRandomLightnessTint(this, 0.16, 0.86, 0.6);
        this._label = game.make.image(0, 0, "assets", "weapons/e-burst-01");
        this._label.scale.setTo(0.42, 0.42);
    } else if (this.type === "weapon-machine-gun") {
        spriteUtils.applyRandomLightnessTint(this, 1.0, 0.64, 0.46);
        this._label = game.make.image(0, 0, "assets", "weapons/slug");
        this._label.scale.setTo(0.42, 0.42);
    } else if (this.type === "weapon-laser") {
        spriteUtils.applyRandomLightnessTint(this, 0.22, 0.7, 0.3);
        this._label = game.make.image(0, 0, "assets", "weapons/laser-01");
        this._label.scale.setTo(0.76, 0.76);
    } else if (this.type === "weapon-beam") {
        spriteUtils.applyRandomLightnessTint(this, 0.54, 1, 0.6);
        this._label = game.make.image(0, 0, "assets", "weapons/death-beam");
        this._label.scale.setTo(0.56, 0.56);
    } else if (this.type === "weapon-arrow") {
        spriteUtils.applyRandomLightnessTint(this, 0.16, 0.42, 0.74);
        this._label = game.make.image(0, 0, "assets", "weapons/arrow");
        this._label.rotation =+ (Math.PI); // rotate 180 degrees
    } else if (this.type === "grenade") {
        spriteUtils.applyRandomLightnessTint(this, 0.71, 0.95, 0.21);
        this._label = game.make.image(0, 0, "assets", "weapons/e-saw-02");
        this._label.scale.setTo(0.9, 0.9);
    } else if (this.type === "rocket") {
        spriteUtils.applyRandomLightnessTint(this, 0.38, 1, 0.22);
        this._label = game.make.image(0, 0, "assets", "weapons/slug");
        this._label.scale.setTo(0.64, 0.96);
    } else if (this.type === "weapon-slug") {
        spriteUtils.applyRandomLightnessTint(this, 0.99, 0.15, 1.0);
        this._label = game.make.image(0, 0, "assets", "weapons/slug");
        this._label.scale.setTo(0.96, 0.96);
    }

    // Once the label has been chose, set the anchor and position,
    // and add it to the foreground (so it is visible).
    this._label.anchor.copyFrom(this.anchor);
    this._label.position.copyFrom(this.position);
    game.globals.groups.midground.add(this._label);
}

WeaponPickup.prototype.destroy = function () {
    // this._light.destroy();
    this._label.destroy();
    BasePickup.prototype.destroy.apply(this, arguments);
};