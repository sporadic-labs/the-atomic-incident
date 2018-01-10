const style = {
  font: "20px 'Alfa Slab One'",
  fill: "#ffd800",
  stroke: "#b37511",
  strokeThickness: 1
};

export default class PopUpText extends Phaser.Group {
  constructor(game, parentGroup, message, position) {
    super(game, parentGroup, "pop-up-text");

    const text = game.make.text(0, 0, "", style);
    text.anchor.setTo(0.5, 0.5);
    text.position.copyFrom(position);
    text.setText(message);
    this.add(text);

    this._posTween = this.game.tweens
      .create(this.position)
      .to({ y: this.position.y - 30 }, 1000, Phaser.Easing.Quadratic.In, false)
      .start();

    this._fadeTween = this.game.tweens
      .create(this)
      .to({ alpha: 0 }, 1000, Phaser.Easing.Quadratic.In, false)
      .start();

    this._fadeTween.onComplete.add(() => this.destroy());
  }

  update() {
    super.update();
  }

  destroy() {
    this.game.tweens.remove(this._fadeTween);
    this.game.tweens.removeFrom(this._posTween);
    super.destroy();
  }
}
