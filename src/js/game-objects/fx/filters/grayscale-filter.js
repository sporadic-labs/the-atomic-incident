import fragmentSrc from "./grayscale-filter.glsl";

export default class GrayscaleFilter extends Phaser.Filter {
  constructor(game) {
    super(game);

    this.fragmentSrc = fragmentSrc;
    this.uniforms.factor = { type: "1f", value: 0 };

    this.game.tweens
      .create(this.uniforms.factor)
      .to({ value: 1 }, 2000, Phaser.Easing.Linear.In, false, 2000)
      .to({ value: 0 }, 2000, Phaser.Easing.Linear.Out, false, 2000)
      .repeatAll(-1)
      // .yoyo(true, 0, -1)
      .start();
  }

  update(...args) {
    super.update(...args);
  }
}
