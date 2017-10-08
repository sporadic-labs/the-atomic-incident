const baseTextStyle = { font: "30px 'Alfa Slab One'", fill: "#ffd800" };

export default class Score extends Phaser.Group {
  constructor(game, parent, player, weaponSpawner) {
    super(game, parent, "score");

    this._comboMultiplier = 1;
    this._comboTimeout = 8000;
    this._comboTimer = game.time.create(false);
    this._comboTimer.start();

    this._comboModifierText = game.make.text(0, 0, "", baseTextStyle);
    this._comboModifierText.anchor.setTo(1, 0);
    this.add(this._comboModifierText);

    player.onDamage.add(this._resetCombo, this);
    weaponSpawner.onPickupCollected.add(this._incrementCombo, this);

    this._updateDisplay();
  }

  getCombo() {
    return this._comboMultiplier;
  }

  _resetCombo() {
    this._comboTimer.removeAll();
    this._comboMultiplier = 1;
    this._updateDisplay();
  }

  _incrementCombo() {
    this._comboTimer.removeAll();
    this._comboMultiplier += 1;
    this._comboTimer.add(this._comboTimeout, () => this._resetCombo());
    this._comboModifierText.alpha = 1;
    this.game.tweens.removeFrom(this._comboModifierText);
    this.game.make
      .tween(this._comboModifierText)
      .to({ alpha: 0 }, this._comboTimeout, Phaser.Easing.Linear.None, true);
    this._updateDisplay();
  }

  _updateDisplay() {
    this._comboModifierText.visible = this._comboMultiplier > 1;
    this._comboModifierText.setText(`${this._comboMultiplier}x`);
  }

  destroy(...args) {
    this._comboTimer.destroy();
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
