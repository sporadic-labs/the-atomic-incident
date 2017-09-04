import utils from "../../helpers/utilities";

/**
 * Keep track of the players Current Combo, and handle updates to the Score.
 * 
 * @export
 * @class ComboTracker
 */
export default class ComboTracker {
  constructor(game, comboTimeout) {
    // Store the game.
    this.game = game;
    //Current combo value.
    this._comboModifier = 0;
    // Current kill streak.
    this._killStreak = 0;
    // Current score, kill streak x combo modifier.
    this._comboScore = 0;

    // Timer to determine when the combo resets.
    this._comboTimeout = utils.default(comboTimeout, 2500);
    this._comboTimer = game.time.create(false); // Doesn't autodestroy
    this._comboTimer.start();
  }

  /**
     * Getter for the Combo modifier value.
     * 
     * @returns 
     * @memberof ComboTracker
     */
  getComboModifier() {
    return this._comboModifier;
  }

  /**
   * Getter for the current kill streak.
   * 
   * @returns 
   * @memberof ComboTracker
   */
  getKillStreak() {
    return this._killStreak;
  }

  /**
   * Getter for Combo score.
   * 
   * @returns 
   * @memberof ComboTracker
   */
  getComboScore() {
    return this._comboScore;
  }

  /**
   * Reset the combo.
   * NOTE(rex): Feels better if you keep whatever score you have
   * earned before you got hit.
   * 
   * @memberof ComboTracker
   */
  resetCombo() {
    this._comboModifier = 0;
    this._killStreak = 0;
    this._comboScore = 0;
  }

  /**
   * Update the Score and Reset the combo.
   * This probably happens when the player gets hit
   * and the score is lost.
   * 
   * @memberof ComboTracker
   */
  updateScoreAndResetCombo() {
    // Shorthand
    const scoreKeeper = this.game.globals.scoreKeeper;
    // Update the score.
    scoreKeeper.incrementScore(this._comboScore);
    // And reset the combo variables.
    this.resetCombo();
  }

  /**
     * Increment the Combo by the value provided.
     * 
     * @param {any} increment kill streak
     * @param {any} increment combo modifier
     * @memberof ComboTracker
     */
  incrementCombo(killValue, modValue) {
    // Shorthand
    const hud = this.game.globals.hud;
    // Update the combo modifier, kill streak, and score.
    this._comboModifier += utils.default(modValue, 0.2);
    this._killStreak += utils.default(killValue, 1);
    this._comboScore = Math.round(this._killStreak * this._comboModifier);

    // Start the HUD combo animation.
    hud.startHudComboAnimation(this._comboTimeout);

    /* Reset the timer.  If the timer runs out, update the current score,
     * and reset the combo variables.
     */
    this._comboTimer.removeAll();
    this._comboTimer.add(this._comboTimeout, () => {
      this.updateScoreAndResetCombo();
    });
  }

  /**
     * Cleanup the cooldownTimer when this component is destroyed.
     * 
     * @memberof ComboTracker
     */
  destroy() {
    this._comboTimer.destroy();
  }
}
