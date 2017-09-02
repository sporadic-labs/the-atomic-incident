import fragmentSrc from "./rgb-split.glsl";

export default class RgbSplitFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = fragmentSrc;
        this.uniforms.displacement = {type: "1f", value: 0};
        this.uniforms.resolution = {type: "2f", value: {x: game.width, y: game.height}};

        this._currentDisplacement = 30;
        this._msSpeed = 30 / 100; // px / ms
        this._msInterval = 1000;
        this._tween = null;
        this._looping = false;
        this._lastSplitTime = 0;
        this._timer = game.time.create(false);
        this._timer.start();
    }

    /**
     * Set the strength of the next RGB displacement in pixels
     * 
     * @param {any} pixels Size of displacement in pixels
     * @returns {this}
     * @memberof RgbSplitFilter
     */
    setDisplacement(pixels) {
        this._currentDisplacement = pixels;
        return this;
    }

    /**
     * Sets the ms delay between RGB split animations, when looping
     * 
     * @param {any} msInterval 
     * @returns {this}
     * @memberof RgbSplitFilter
     */
    setLoopInterval(msInterval) {
        this._msInterval = msInterval;
        return this;
    }

    /**
     * Trigger a single RGB split animation.
     * 
     * @returns {this}
     * @memberof RgbSplitFilter
     */
    triggerSplit() {
        this._destroyTween();
        const duration = this._currentDisplacement / this._msSpeed;
        this._tween = this.game.tweens.create(this.uniforms.displacement)
            .to({value: this._currentDisplacement}, duration / 2, Phaser.Easing.Bounce.In)
            .to({value: 0}, duration / 2, Phaser.Easing.Quadratic.Out)
            .start();
        return this;
    }

    /**
     * Trigger an RGB split animation immediately and set it to loop indefinitely. It's safe to call
     * this function repeatedly, becuase if the filter is already looping, this won't do anything.
     * 
     * @returns {this}
     * @memberof RgbSplitFilter
     */
    loopSplit() {
        if (!this._looping) {
            this._looping = true;
            this._lastSplitTime = this._timer.ms;
            this.triggerSplit();
        }
        return this;
    }

    /**
     * Stop any running RGB split animation and stop looping
     * 
     * @returns {this}
     * @memberof RgbSplitFilter
     */
    stopSplit() {
        this._destroyTween();
        this._looping = false;
        this.uniforms.displacement.value = 0;
        return this;
    }

    update(...args) {
        if (this._looping && this._timer.ms >= (this._lastSplitTime + this._msInterval)) {
            this.triggerSplit();
            this._lastSplitTime = this._timer.ms;
        }
        super.update(...args);
    }

    destroy(...args) {
        this._timer.destroy();
        this._destroyTween();
        super.destory(...args);
    }
    
    _destroyTween() {
        if (this._tween) {
            this._tween.stop();
            this._tween.manager.remove(this._tween);
            this._tween = null;
        }
    }
}