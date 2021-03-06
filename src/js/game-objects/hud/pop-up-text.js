import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Johnyokonysm", { size: "22px" }),
  fill: "#81B8AE"
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
      .to({ y: this.position.y - 30 }, 1200, Phaser.Easing.Quadratic.In, false, 100)
      .start();

    this._fadeTween = this.game.tweens
      .create(this)
      .to({ alpha: 0 }, 1300, Phaser.Easing.Quadratic.In, false)
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
