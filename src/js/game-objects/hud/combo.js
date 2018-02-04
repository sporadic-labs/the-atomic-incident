import getFontString from "../../fonts/get-font-string";

const baseTextStyle = {
  font: getFontString("Montserrat", { size: "35px", weight: 300 }),
  fill: "#ffd800"
};

export default class Score extends Phaser.Group {
  constructor(game, parent, player, enemyGroup) {
    super(game, parent, "score");

    this._comboMultiplier = 1;
    // this._comboTimeout = 16000; // ms
    // this._comboTimer = game.time.create(false);
    // this._comboTimer.start();

    this._comboModifierText = game.make.text(0, 0, "", baseTextStyle);
    this._comboModifierText.anchor.setTo(0.5, 0.5);
    this.add(this._comboModifierText);

    player.onDamage.add(this._resetCombo, this);
    enemyGroup.onEnemyKilled.add(() => this._incrementCombo(0.1));

    this._updateDisplay();
  }

  getCombo() {
    return this._comboMultiplier;
  }

  _resetCombo() {
    this._comboMultiplier = 1;
    this._updateDisplay();
    // this._comboTimer.removeAll();
  }

  _incrementCombo(increment) {
    this._comboMultiplier += increment;
    this._updateDisplay();
    // this._comboModifierText.alpha = 1;
    // this._comboTimer.removeAll();
    // this._comboTimer.add(this._comboTimeout, () => this._resetCombo());
    // this.game.tweens.removeFrom(this._comboModifierText);
    // this.game.make
    //   .tween(this._comboModifierText)
    //   .to({ alpha: 0 }, this._comboTimeout, Phaser.Easing.Linear.None, true);
  }

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

// /**
//  * Start the hud combo animation.
//  * TODO(rex): Do something better here...
//  *
//  * @param {any} duration
//  * @memberof HeadsUpDisplay
//  */
// startHudComboAnimation(duration) {
//   // Set variables used for the HUD combo animation.
//   this._comboAnimationDuration = duration; // TODO(rex): Default.
//   this._comboAnimationStartTime = Date.now();
//   this._playComboAnimation = true;
// }

// /**
//  * Manually updating the mask around the combo text.
//  * TODO(rex): This isn't being used right now...
//  *
//  * @memberof HeadsUpDisplay
//  */
// _hudComboAnimation() {
//   // Get the current time, figure our progress through the animation timer,
//   // and update the hud accordingly.
//   const currentTime = Date.now();
//   const diff = currentTime - this._comboAnimationStartTime;
//   if (diff < this._comboAnimationDuration) {
//     // Update the combo mask.
//     const fractionMasked = diff / this._comboAnimationDuration;
//     const cropAmount = fractionMasked * this._comboModifierMask.width;
//     this._comboModifierMask.crop(
//       new Phaser.Rectangle(0, 0, cropAmount, this._comboModifierMask.height)
//     );
//   } else {
//     // The animation has ended, reset animation variables.
//     this._playComboAnimation = false;
//     this._comboAnimationStartTime = 0;
//     this._comboAnimationDuration = 0; // TODO(rex): This...?
//     this._comboModifierMask.visible = false;
//   }
// }
