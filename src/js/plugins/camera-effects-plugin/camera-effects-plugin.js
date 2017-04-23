class Effects extends Phaser.Plugin {
    /**
     * Creates an instance of Effects.
     * @param {Phaser.Game} game 
     * @param {Phaser.PluginManager} manager 
     * 
     * @memberOf Effects
     */
    constructor(game, manager) {
        super(game, manager);
        this.game = game;
        this._pluginManager = manager;
        this.camera = this.game.camera;

        this._fxGraphics = game.add.graphics(0, 0);
        this._tween = null;
    }

    /**
     * Animates a full screen overlay that flashing in & out (via alpha)
     * 
     * @param {number} color The color to use for the flash overlay
     * 
     * @memberOf Effects
     */
    lightFlash(color) {
        this._fxGraphics.clear();
        this._fxGraphics.beginFill(color);
        this._fxGraphics.drawRect(0, 0, this.game.width, this.game.height);
        this._fxGraphics.endFill();
        this._fxGraphics.alpha = 0;

        if (this._tween) this._tween.stop();

        // Trying to simulate a blinding flash:
        // Fade alpha in really quickly -> hold -> fade out halfway quickly ->
        // slowly fade out the rest
        this._tween = this.game.add.tween(this._fxGraphics).to(
            {alpha: 0.9}, 20, Phaser.Easing.Quadratic.In, false, 50
        ).to(
            {alpha: 0.5}, 150, Phaser.Easing.Linear.None, false
        ).to(
            {alpha: 0}, 800, Phaser.Easing.Quadratic.Out, false
        ).start();
    }

    destroy() {
        this._fxGraphics.destroy();
        if (this._tween) this.game.tweens.remove(this._tween);
        super.destroy(...arguments);
    }
}

Phaser.Plugin.CameraEffects = Effects; // Expose the plugin on the global Phaser
module.exports = Effects;
