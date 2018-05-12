import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#FFEB6E"
};

export default class HudMessageDisplay extends Phaser.Group {
  constructor(game, parentGroup) {
    super(game, parentGroup, "hud-message");

    this.text = game.make.text(game.width / 2, game.height, "", style);
    this.text.anchor.setTo(0.5, 1);
    this.add(this.text);

    this.tween = null;

    this.messageQueue = [];
  }

  setMessage(text) {
    this.messageQueue.push(text);
    if (!this.isShowingMessage()) this.showNextMessage();
    return this;
  }

  isShowingMessage() {
    return this.tween && this.tween.isRunning;
  }

  showNextMessage() {
    const text = this.messageQueue.shift();
    this.text.setText(text);
    this.text.alpha = 0;
    this.tween = this.game.tweens
      .create(this.text)
      .to({ alpha: 1 }, 200, Phaser.Easing.Cubic.Out, false)
      .to({ alpha: 0 }, 2000, Phaser.Easing.Cubic.In, false, 2000);
    this.tween.onComplete.addOnce(() => {
      if (this.messageQueue.length !== 0) this.showNextMessage();
      else this.tween = null;
    });
    this.tween.start();
  }

  destroy(...args) {
    if (this.tween) this.game.tweens.remove(this.tween);
    super.destroy(...args);
  }
}
