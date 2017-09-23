import Radar from "./radar";

/**
 * Player Heads Up Display.
 * Advanced HUD made with bleeding edge nano tech and the most advanced
 * x-ray, sonar, infrared and [REDACTED] for unmatched exploration.
 * Keeps track of Pause/Mute, Score, Ammo, and FPS (debug only!).
 * 
 * @class HeadsUpDisplay
 * @extends {Phaser.Group}
 */
export default class HeadsUpDisplay extends Phaser.Group {
  /**
     * @param {Phaser.Game} game
     * @param {Phaser.Group} parentGroup
     */
  constructor(game, parentGroup) {
    super(game, parentGroup, "heads-up-display");

    this.game = game;
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this.fixedToCamera = true;

    this.radar = new Radar(game, this.game.globals.groups.enemies);

    // HUD animation variables.
    this._comboAnimationStartTime = 0;
    this._comboAnimationDuration = 0;
    this._playComboAnimation = false;
    this._reloadAnimationStartTime = 0;
    this._reloadAnimationDuration = 0;
    this._playReloadAnimation = false;

    // Text for HUD
    // Score
    this._scoreText = game.make.text(this.game.width - 18, 32, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "right"
    });
    this._scoreText.anchor.setTo(1, 0.5);
    this.add(this._scoreText);
    this._scorePadText = game.make.text(this.game.width - this._scoreText.width - 18, 32, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#a0976a",
      align: "right"
    });
    this._scorePadText.anchor.setTo(1, 0.5);
    this.add(this._scorePadText);

    // Combo
    this._comboModifierText = game.make.text(this.game.width - 18, 64, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "right"
    });
    this._comboModifierText.anchor.setTo(1, 0.5);
    this.add(this._comboModifierText);

    // Ammo
    this._ammoText = game.make.text(18, 32, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "left"
    });
    this._ammoText.anchor.setTo(0, 0.5);
    this.add(this._ammoText);

    // Debug
    this._debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C",
      align: "left"
    });
    this._debugText.anchor.set(0, 1);
    this.add(this._debugText);

    this._fpsText = game.make.text(15, game.height - 25, "60", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C",
      align: "left"
    });
    this._fpsText.anchor.set(0, 1);
    this.add(this._fpsText);
  }

  /**
     * Update lifecycle hook.
     * 
     * @memberof HeadsUpDisplay
     */
  update() {
    // Shorthand
    const scoreKeeper = this.game.globals.scoreKeeper;
    const comboTracker = this.game.globals.comboTracker;

    if (!this._player.weapon._isReloading) {
      this._ammoText.setText(
        this._player.weapon.getAmmo() + " / " + this._player.weapon._totalAmmo
      );
    } else {
      this._ammoText.setText("Reloading...");
    }

    this._fpsText.setText(this.game.time.fps);

    // Update score and combo.
    this._scoreText.setText(scoreKeeper.getScore());
    this._scorePadText.x = this.game.width - this._scoreText.width - 18;
    const pad = this._getTextPadding(scoreKeeper.getScore(), 6, "0");
    this._scorePadText.setText(pad);
    this._comboModifierText.setText(comboTracker.getComboModifier().toFixed(1) + "x");

    // Update Enemy Trackers
    this.radar.update();

    super.update();
  }

  /**
   * Start the hud reload animation.
   * TODO(rex): Do something better here...
   * 
   * @param {int} duration
   * @memberof HeadsUpDisplay
   */
  startHudReloadAnimation(duration) {
    // Set variables used for the HUD reload animation.
    this._reloadAnimationDuration = duration; // TODO(rex): Default.
    this._reloadAnimationStartTime = Date.now();
    this._playReloadAnimation = true;
  }

  /**
   * Manually updating the mask around the reload text.
   * TODO(rex): This isn't being used right now...
   * 
   * @memberof HeadsUpDisplay
   */
  _hudReloadAnimation() {
    // Get the current time, figure our progress through the animation timer,
    // and update the hud accordingly.
    const currentTime = Date.now();
    const diff = currentTime - this._reloadAnimationStartTime;
    if (diff < this._reloadAnimationDuration) {
      // Update the reload mask.
      const fractionMasked = diff / this._reloadAnimationDuration;
      const cropAmount = fractionMasked * this._ammoText.width;
      this._ammoText.crop(new Phaser.Rectangle(0, 0, cropAmount, this._ammoText.height));
    } else {
      // The animation has ended, reset animation variables.
      this._playReloadAnimation = false;
      this._reloadAnimationStartTime = 0;
      this._reloadAnimationDuration = 0; // TODO(rex): This...?
      this._ammoMask.visible = false;
    }
  }

  /**
   * Start the hud combo animation.
   * TODO(rex): Do something better here...
   * 
   * @param {any} duration 
   * @memberof HeadsUpDisplay
   */
  startHudComboAnimation(duration) {
    // Set variables used for the HUD combo animation.
    this._comboAnimationDuration = duration; // TODO(rex): Default.
    this._comboAnimationStartTime = Date.now();
    this._playComboAnimation = true;
  }

  /**
   * Manually updating the mask around the combo text.
   * TODO(rex): This isn't being used right now...
   * 
   * @memberof HeadsUpDisplay
   */
  _hudComboAnimation() {
    // Get the current time, figure our progress through the animation timer,
    // and update the hud accordingly.
    const currentTime = Date.now();
    const diff = currentTime - this._comboAnimationStartTime;
    if (diff < this._comboAnimationDuration) {
      // Update the combo mask.
      const fractionMasked = diff / this._comboAnimationDuration;
      const cropAmount = fractionMasked * this._comboModifierMask.width;
      this._comboModifierMask.crop(
        new Phaser.Rectangle(0, 0, cropAmount, this._comboModifierMask.height)
      );
    } else {
      // The animation has ended, reset animation variables.
      this._playComboAnimation = false;
      this._comboAnimationStartTime = 0;
      this._comboAnimationDuration = 0; // TODO(rex): This...?
      this._comboModifierMask.visible = false;
    }
  }

  /**
   * Pad the text value by a certain number of digits.
   * 
   * @param {any} value - Value to include in this padded text string.
   * @param {int} digits - Total digits the returned text should be.
   * @param {string} char - Character to pad the text with, defaults to "0".
   * @returns {string} - Padded text with the appropriate number of digits!
   * @memberof HeadsUpDisplay
   */
  _padText(value, digits, char) {
    // Provide a default character of 0, if no character was provided.
    const charToPadWith = char ? char : "0";
    // Provide a default value to pad, in case it wasn't passed in...
    const valueToPad = value ? (value += "") : "0";
    // Provide a default number of characters to pad.
    const totalDigits = digits ? digits : 4;
    // Figure out how many padding digits need to be added.
    const numOfDigitsToPad = totalDigits >= valueToPad.length ? totalDigits - valueToPad.length : 0;
    // Create an accumulator for this new padded text.
    let paddedText = "";
    // For each digit to pad, add the character to pad with to the accumulator.
    for (let i = 0; i < numOfDigitsToPad; i++) {
      paddedText += charToPadWith;
    }
    // Finally, add the value to the accumulated text.
    paddedText += valueToPad;
    // And return the padded text.
    return paddedText;
  }

  /**
   * Get the padding prefix for the score, based on the number and character provided.
   * 
   * @param {any} value - Value to include in this padded text string.
   * @param {int} digits - Total digits the returned text should be.
   * @param {string} char - Character to pad the text with, defaults to "0".
   * @returns {string} - Padded text with the appropriate number of digits!
   * @memberof HeadsUpDisplay
   */
  _getTextPadding(value, digits, char) {
    // Provide a default character of 0, if no character was provided.
    const charToPadWith = char ? char : "0";
    // Provide a default value to pad, in case it wasn't passed in...
    const valueToPad = value ? (value += "") : "0";
    // Provide a default number of characters to pad.
    const totalDigits = digits ? digits : 4;
    // Figure out how many padding digits need to be added.
    const numOfDigitsToPad = totalDigits >= valueToPad.length ? totalDigits - valueToPad.length : 0;
    // Create an accumulator for this new padded text.
    let paddedText = "";
    // For each digit to pad, add the character to pad with to the accumulator.
    for (let i = 0; i < numOfDigitsToPad; i++) {
      paddedText += charToPadWith;
    }
    // And return the padding prefix text.
    return paddedText;
  }

  /**
   * Destroy lifecycle hook.
   * 
   * @memberof HeadsUpDisplay
   */
  destroy(...args) {
    super.destroy(...args);
  }
}
