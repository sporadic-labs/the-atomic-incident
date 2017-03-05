module.exports = ScorePickup;

var BasePickup = require("./base-pickup.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

ScorePickup.prototype = Object.create(BasePickup.prototype);
ScorePickup.prototype.constructor = ScorePickup;

function ScorePickup(game, x, y) {
    var pickups = game.globals.groups.pickups;
    BasePickup.call(this, game, x, y, "assets", "pickups/diamond-01",
        pickups, "score", 1, 10000);

    spriteUtils.applyRandomLightnessTint(this, 0.52, 1, 0.6);
}

ScorePickup.prototype.destroy = function () {
    BasePickup.prototype.destroy.apply(this, arguments);
};