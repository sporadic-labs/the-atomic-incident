import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "24px", weight: 800, align: "center" }),
  fill: "#FFEB6E"
};

export default class Wave extends Phaser.Group {
  constructor(game, parent, onWaveSpawn) {
    super(game, parent, "wave-indicator");

    this._waveText = game.make.text(0, 20, "Wave ", style);
    this._waveText.anchor.set(0.5, 0.5);
    this.add(this._waveText);

    this._waveNumText = game.make.text(0, 20, "", style);
    this._waveNumText.anchor.set(0.5, 0.5);
    this.add(this._waveNumText);

    // Non-monospace font, so approximate fixed spacing using a fat digit ("0")
    this._waveNumText.setText("0", true);
    this._singleDigitWidth = this._waveNumText.width * 0.9;

    this._centerText(1);

    this._waveNumText.setText("1");
    onWaveSpawn.add(this.onWaveSpawn);
  }

  onWaveSpawn = waveNum => {
    if (waveNum === 1) return;

    const scale = this._waveNumText.scale;
    scale.set(1);
    this.game.tweens.removeFrom(scale);
    const delay = 1000;

    const yTween = this.game.make
      .tween(scale)
      .to({ y: 0 }, 200, Phaser.Easing.Cubic.In, false, delay)
      .start();
    this.game.make
      .tween(scale)
      .to({ x: 0 }, 400, Phaser.Easing.Cubic.Out, false, delay)
      .start();
    yTween.onComplete.addOnce(() => {
      this.setWaveNumber(waveNum);
      this.game.make
        .tween(scale)
        .to({ y: 1 }, 200, Phaser.Easing.Cubic.Out)
        .start();
      this.game.make
        .tween(scale)
        .to({ x: 1 }, 400, Phaser.Easing.Cubic.Out)
        .start();
    });
  };

  setWaveNumber(waveNumber) {
    const numDigits = waveNumber.toString().length;
    this._waveNumText.setText(waveNumber);
    this._centerText(numDigits);
  }

  _centerText(numDigits) {
    // Since text is positioned via a center anchor for scale tweening, center the text on the
    // screen manually.
    const gameCenterX = this.game.width / 2;
    const waveNumTextWidth = numDigits * this._singleDigitWidth;
    const totalTextWidth = this._waveText.width + waveNumTextWidth;
    this._waveText.x = gameCenterX - totalTextWidth / 2 + this._waveText.width / 2;
    this._waveNumText.x = this._waveText.right + waveNumTextWidth / 2;
  }

  destroy(...args) {
    this.game.tweens.removeFrom(this._waveNumText.scale);
    super.destroy(...args);
  }
}
