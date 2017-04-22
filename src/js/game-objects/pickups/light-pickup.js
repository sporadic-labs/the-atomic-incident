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

        this.pickupSound = this.game.globals.soundManager.add("whoosh");
    }

    pickUp() {
        // Screen flash after a short delay
        const cam = this.game.camera;
        const timer = this.game.time.create(true);
        timer.add(50, () => {
            cam.flash(this.color.getRgbColorInt(), 300, true, 0.9);
        });
        timer.start();
        this.pickupSound.play();
        this.destroy();
    }

    destroy() {
        this.light.destroy();
        super.destroy(...arguments);
    }
}

module.exports = LightPickup;
