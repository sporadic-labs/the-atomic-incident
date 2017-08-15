import GrayscaleFilter from "./filters/grayscale-filter";
import VignetteFilter from "./filters/vignette-filter";
import RgbSplitFilter from "./filters/rgb-split-filter";

class PostProcessor extends Phaser.Sprite {
    constructor(game, postTarget) {
        // Create a sprite at top left of screen that sits above the game but below the HUD
        super(game, 0, 0);
        game.globals.groups.gameOverlay.add(this);

        // Create a render texture for the sprite that matches screen size
        this.renderTexture = new Phaser.RenderTexture(game, game.width, game.height);
        this.setTexture(this.renderTexture, true);

        this.postTarget = postTarget;

        this.grayscaleFilter = new GrayscaleFilter(game);
        this.vignetteFilter = new VignetteFilter(game);
        this.rgbSplitFilter = new RgbSplitFilter(game);

        this.filters = [this.rgbSplitFilter, this.vignetteFilter];
    }

    update() {
        for (const filter of this.filters) {
            if (filter.update) filter.update();
        }
        // Draw severything that is targeted. Screen shake is baked into Phaser's rendering process,
        // so in order to preserve it, we need to offset the target by the shake amount.
        const shake = this.game.camera._shake || {x: 0, y: 0};
        this.renderTexture.renderXY(this.postTarget, shake.x, shake.y, true);
    }

    // This was used to force a screen clear on the render texture before drawing, but I don't
    // believe it is necessary anymore.
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