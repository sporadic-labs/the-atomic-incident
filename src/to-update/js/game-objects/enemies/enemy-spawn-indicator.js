export default class EnemySpawnIndicator extends Phaser.Sprite {
  constructor(game, x, y, duration) {
    super(game, x, y, "assets", "hud/enemy-spawn-indicator");

    this.anchor.setTo(0.5, 0.5);
    this.scale.setTo(0);

    this.onFinished = new Phaser.Signal();

    // Fancy scale in -> blink -> fire "finished" signal -> fancy scale out
    this.scaleToTween(1, () => {
      const blinksPerMs = 1 / 1200;
      const blinks = duration * blinksPerMs;
      const blinkTween = this.game.make
        .tween(this)
        .to({ alpha: 0.25 }, 200, "Quad.easeInOut")
        .yoyo(true)
        .repeatAll(blinks);
      blinkTween.onComplete.addOnce(() => {
        this.onFinished.dispatch();
        this.scaleToTween(0, () => this.destroy());
      });
      blinkTween.start();
    });
  }

  scaleToTween(target, onComplete) {
    this.game.make
      .tween(this.scale)
      .to({ y: target }, 250, Phaser.Easing.Bounce.Out)
      .start();
    const xTween = this.game.make
      .tween(this.scale)
      .to({ x: target }, 400, Phaser.Easing.Bounce.Out);
    xTween.onComplete.addOnce(onComplete);
    xTween.start();
  }

  destroy() {
    this.onFinished.dispose();
    this.game.tweens.removeFrom(this);
    this.game.tweens.removeFrom(this.scale);
    super.destroy();
  }
}
