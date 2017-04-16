module.exports = LightPickup;

var Color = require("../../helpers/Color.js");

LightPickup.prototype = Object.create(Phaser.Sprite.prototype);

function LightPickup(game, x, y, parentGroup, color) {
    Phaser.Sprite.call(this, game, x, y, "assets", "pickups/diamond-01");
    this.color = (color instanceof Color) ? color : new Color(color);
    this.tint = this.color.getRgbColorInt();
    parentGroup.add(this);

    // Configure physics
    game.physics.arcade.enable(this);
    this.satBody = game.globals.plugins.satBody.addBoxBody(this);
}