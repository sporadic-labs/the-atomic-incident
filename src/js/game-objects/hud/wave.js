import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "24px", weight: 800, align: "center" }),
  fill: "#FFEB6E"
};

// Move to util since this is now used in multiple places:
const scaleTween = (game, scale, initialValue, maxValue, finalValue) => {
  scale.set(initialValue);
  game.tweens.removeFrom(scale);
  game.make
    .tween(scale)
    .to({ y: maxValue }, 200, Phaser.Easing.Bounce.Out)
    .start();
  const xTween = game.make
    .tween(scale)
    .to({ x: maxValue }, 400, Phaser.Easing.Bounce.Out)
    .start();
  xTween.onComplete.addOnce(() => {
    game.make
      .tween(scale)
      .to({ y: finalValue }, 200, Phaser.Easing.Bounce.Out)
      .start();
    game.make
      .tween(scale)
      .to({ x: finalValue }, 400, Phaser.Easing.Bounce.Out)
      .start();
  });
};

export default class Wave extends Phaser.Group {
  constructor(game, parent, onWaveSpawn) {
    super(game, parent, "wave-indicator");

    this._waveText = game.make.text(this.game.width / 2, 25, "", style);
    this._waveText.anchor.set(0.5, 0.5);
    this.add(this._waveText);

    onWaveSpawn.add(this.onWaveSpawn);
  }

  onWaveSpawn = waveNum => {
    this._waveText.setText(`Wave ${waveNum}`);
    scaleTween(this.game, this._waveText.scale, 1, 1.5, 1);
  };

  _updateDisplay() {
    this._comboModifierText.visible = this._comboMultiplier > 1;
    this._comboModifierText.setText(`${this._comboMultiplier.toFixed(1)}x`);

    // Combo text is anchored at (0.5, 0.5) for a scaling tween, but we want to position the group
    // via an anchor of (1, 0) so that we can align it against the right edge of the screen.
    this._comboModifierText.x = -0.5 * this._comboModifierText.width;
    this._comboModifierText.y = 0.5 * this._comboModifierText.height;

    this.game.tweens.removeFrom(this._comboModifierText.scale);
    this.game.make
      .tween(this._comboModifierText.scale)
      .to({ y: 1.1 }, 100, Phaser.Easing.Bounce.Out)
      .start();
    const xTween = this.game.make
      .tween(this._comboModifierText.scale)
      .to({ x: 1.1 }, 200, Phaser.Easing.Bounce.Out)
      .start();
    xTween.onComplete.addOnce(() => {
      this.game.make
        .tween(this._comboModifierText.scale)
        .to({ y: 1 }, 100, Phaser.Easing.Bounce.Out)
        .start();
      this.game.make
        .tween(this._comboModifierText.scale)
        .to({ x: 1 }, 200, Phaser.Easing.Bounce.Out)
        .start();
    });
  }

  destroy(...args) {
    // this._comboTimer.destroy();
    super.destroy(...args);
  }
}
