module.exports = RustySword;

var BaseMelee = require("./base-melee.js");
var SpriteUtils = require("../../helpers/sprite-utilities.js");

RustySword.prototype = Object.create(BaseMelee.prototype);

function RustySword(game, parentGroup, player) {
    BaseMelee.call(this, game, "assets", "weapons/sword",
        parentGroup, player, 26);
    this.scale.setTo(0.72, 0.72);
    this.initCooldown(360, 980);
}

RustySword.prototype.fire = function (targetPos) {
    if (this._ableToAttack) {
        this.swing(targetPos, 156);
        this._startCooldown(this._cooldownTime);
    }
};

RustySword.prototype.specialFire = function (targetPos) {
    if (this._ableToAttack) {
        this.specialSwing(targetPos, 720);
        this._startCooldown(this._cooldownTime);
    }
};
