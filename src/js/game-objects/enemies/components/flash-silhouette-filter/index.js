import fragmentSrc from "./silhouette.glsl";

export default class FlashSilhouetteFilter extends Phaser.Filter {
  constructor(game) {
    super(game);

    this.fragmentSrc = fragmentSrc;
    this.uniforms.silhouetteStrength = { type: "1f", value: 0 };
    this.uniforms.silhouetteColor = { type: "3f", value: { x: 0, y: 0, z: 0 } };
    this.setColor(255, 66, 66);
  }

  setColor(r, g, b) {
    this.uniforms.silhouetteColor = {
      type: "3f",
      value: { x: r / 255, y: g / 255, z: b / 255 }
    };
  }

  startFlash(duration = 175, maxStrength = 0.75) {
    // Stop currently running tween so that if multiple flashes are triggered, they don't overlap
    // and the next one will start at wherever silhouetteStrength was left
    if (this._tween) this._tween.stop();

    this.uniforms.silhouetteStrength.value = maxStrength;

    this._tween = this.game.tweens
      .create(this.uniforms.silhouetteStrength)
      .to({ value: 0 }, 100, Phaser.Easing.Quadratic.Out, false, duration)
      .start();
  }
}
