var Color = require("../../helpers/Color.js");

class LightPickup extends Phaser.Sprite {
    constructor(game, x, y, parentGroup, color) {
        super(game, x, y, "assets", "pickups/diamond-01");
        this.anchor.set(0.5);
        this.color = (color instanceof Color) ? color : new Color(color);
        parentGroup.add(this);
        // Configure physics
        game.physics.arcade.enable(this);
        this.satBody = game.globals.plugins.satBody.addBoxBody(this);

        this._lighting = this.game.globals.plugins.lighting;
        const lightColor = color.clone().setTo({a: 200});
        this.light = this._lighting.addLight(new Phaser.Point(x, y), 
            new Phaser.Circle(0, 0, 100), lightColor);
    }

    destroy() {
        this.light.destroy();
        super.destroy(...arguments);
    }
}

module.exports = LightPickup;
