const ShockwaveFilter = require("./filters/shockwave.js");

class PostProcessor extends Phaser.Sprite {
    constructor(game, postTarget) {
        // Create a sprite at top left of screen that sits above the game but below the HUD
        super(game, 0, 0);
        game.globals.groups.gameOverlay.add(this);

        // Create a render texture for the sprite that matches screen size
        this.renderTexture = new Phaser.RenderTexture(game, game.width, game.height);
        this.setTexture(this.renderTexture, true);

        this.postTarget = postTarget;

        this.shockwave = new ShockwaveFilter(game);
        this._isWaveRunning = false;
    }

    startWave(pos) {
        this._isWaveRunning = true;
        this.shockwave.startWave(pos);
        this.filters = [this.shockwave];
    }

    stopWave() {
        this._isWaveRunning = false;
        this.filters = null;
    }

    update() {
        // Clear with opaque white so that this sprite covers up everything else
        this._clear(1, 1, 1, 1);
        // Draw severything that is targeted
        this.renderTexture.renderXY(this.postTarget, 0, 0, false);
        if (this._isWaveRunning) {
            this.shockwave.update();
            // Hack for now: this should be based on the light pulse range
            if (this.shockwave.wavePosition > 200) this.stopWave();
        }
    }

    _clear(r, g, b, a) {
        // A bit of a hack - reach into the webgl context to clear the render texture
        const rt = this.renderTexture;
        const gl = rt.renderer.gl;
        gl.bindFramebuffer(gl.FRAMEBUFFER, rt.textureBuffer.frameBuffer);
        gl.clearColor(r, g, b, a);
        gl.clear(gl.COLOR_BUFFER_BIT);
    }
}

module.exports = PostProcessor;