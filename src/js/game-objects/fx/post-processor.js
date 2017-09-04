import GrayscaleFilter from "./filters/grayscale-filter";
import VignetteFilter from "./filters/vignette-filter";
import RgbSplitFilter from "./filters/rgb-split-filter";

export default class PostProcessor extends Phaser.Sprite {
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

  onPlayerDamage() {
    this.game.camera.shake(0.01, 200);
    this.rgbSplitFilter.setDisplacement(30).triggerSplit();
  }

  /**
     * Set the level of the various post processing effects
     * 
     * @param {any} strength 
     * @memberof PostProcessor
     */
  onHealthUpdate(health = 0) {
    // RGB split
    if (health <= 0) {
      this.rgbSplitFilter
        .setDisplacement(15)
        .setLoopInterval(500)
        .loopSplit();
    } else if (health <= 0.4) {
      const displacement = Phaser.Math.mapLinear(health, 0, 0.4, 15, 5);
      const interval = Phaser.Math.mapLinear(health, 0, 0.4, 800, 1500);
      this.rgbSplitFilter
        .setDisplacement(displacement)
        .setLoopInterval(interval)
        .loopSplit();
    } else {
      this.rgbSplitFilter.stopSplit();
    }

    // Vignette
    if (health <= 0) {
      this.vignetteFilter.opacity(1);
    } else if (health <= 0.75) {
      const opacity = Phaser.Math.mapLinear(health, 0, 0.75, 0.9, 0);
      this.vignetteFilter.opacity(opacity);
    } else {
      this.vignetteFilter.opacity(0);
    }
  }

  update() {
    for (const filter of this.filters) {
      if (filter.update) filter.update();
    }

    this.vignetteFilter.radius(1.5 * this.game.globals.player.getLightRadius());
    this.vignetteFilter.center(this.game.globals.player.position);

    // Draw severything that is targeted. Screen shake is baked into Phaser's rendering process,
    // so in order to preserve it, we need to offset the target by the shake amount.
    const shake = this.game.camera._shake || { x: 0, y: 0 };
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
