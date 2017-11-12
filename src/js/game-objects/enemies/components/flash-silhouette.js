import Color from "../../../helpers/color";

export default class FlashSilhouette {
  constructor(target) {
    this.game = target.game;
    this.target = target;

    this._duration = 300;
    this._color = new Color(255, 255, 255);
  }

  startFlash() {
    if (this._tween && this._tween.isRunning) return;

    const transitionTime = 50;
    const silhouetteTime = this._duration - 2 * transitionTime;

    let tweenTarget = { amt: 0 };
    this._tween = this.game.tweens
      .create(tweenTarget)
      .to({ amt: 1 }, transitionTime, Phaser.Easing.Quadratic.In)
      .to({ amt: 0 }, transitionTime, Phaser.Easing.Quadratic.Out, false, silhouetteTime)
      .onUpdateCallback(() => {
        const t = 1 - tweenTarget.amt;
        this.target.tint = this._color.setTo({ g: t * 255, b: t * 255 }).getRgbColorInt();
      })
      .start();
  }
}
