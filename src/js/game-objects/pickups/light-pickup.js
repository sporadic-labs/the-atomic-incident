var Color = require("../../helpers/Color.js");

class LightPickup extends Phaser.Sprite {
    constructor(game, x, y, parentGroup, color) {
        super(game, x, y, "assets", "pickups/diamond-01");
        this.color = (color instanceof Color) ? color : new Color(color);
        this.tint = this.color.getRgbColorInt();
        parentGroup.add(this);
        // Configure physics
        game.physics.arcade.enable(this);
        this.satBody = game.globals.plugins.satBody.addBoxBody(this);
    }
}

module.exports = LightPickup;
