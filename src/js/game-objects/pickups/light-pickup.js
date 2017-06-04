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

        // If the level has changed, make sure the pickup is not inside of a wall
        this._levelManager = game.globals.levelManager;
        this._levelManager.levelChangeSignal.add(this._checkCollision, this);
    }

    _checkCollision() {
        const wallLayer = this.game.globals.levelManager.getCurrentWallLayer();

        // Get all colliding tiles that are within range and destroy if there are any
        const pad = 10;
        const tiles = wallLayer.getTiles(
            this.position.x - pad, this.position.y - pad,
            this.width + pad, this.height + pad, 
            true
        );
        if (tiles.length > 0) this.destroy();
    }

    pickUp() {
        this.destroy();
    }

    destroy() {
        this._levelManager.levelChangeSignal.remove(this._checkCollision, this);
        this.light.destroy();
        super.destroy(...arguments);
    }
}

module.exports = LightPickup;
