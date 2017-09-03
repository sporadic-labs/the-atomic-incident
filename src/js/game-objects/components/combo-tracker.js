import utils from "../helpers/utilities";

/**
 * Keep track of the players Current Combo, and handle updates to the Score.
 * 
 * @export
 * @class ComboTracker
 */
class ComboTracker {
  constructor(game, comboTimeout) {
    //Current combo value.
    this._combo = 0;

    // Timer to determine when the combo resets.
    this._comboTimeout = utils.default(comboTimeout, 2500);
    this._comboTimer = game.time.create(false); // Doesn't autodestroy
    this._comboTimer.start();
  }

  /**
     * Getter for the Combo value.
     * 
     * @returns 
     * @memberof ComboTracker
     */
  getCombo() {
    return this._combo;
  }

  /**
     * Increment the Combo by the value provided.
     * 
     * @param {any} increment 
     * @memberof ComboTracker
     */
  incrementCombo(increment) {
    // Update the combo
    this._combo += utils.default(increment, 1);

    // Reset the timer events and schedule an event to reset the combo to zero
    this._comboTimer.removeAll();
    this._comboTimer.add(this._comboTimeout, () => {
      this._combo = 0;
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

module.exports = ComboTracker;
