/**
 * @module Controller
 */
module.exports = Controller;

/**
 * A helper class for abstracting away a controller. This can register multiple
 * control keys to the same action, e.g. using both "left" and "w" for moving a
 * character left.
 * @class Controller
 * @constructor
 * @param {object} input A reference to a Phaser.input for the current game.
 */
function Controller(input) {
    this._input = input;

    // An object for holding onto the current state of the controls. It holds on
    // to how many keys are pressed for a specific control, e.g. if "left" and
    // "w" are pressed, the state for the "left" key would be 2.
    this._controlStates = {};
}

/**
 * Check whether a specified control is currently active.
 * @param  {string}  controlName The name of the control which was registered in 
 *                               Controller.addKey.
 * @return {Boolean}             Whether or not the control is active.
 */
Controller.prototype.isControlActive = function (controlName) {
    return (this._controlStates[controlName] !== 0);
};

/**
 * Register a key or keys under a control name.
 * @param {string}          controlName The name of the control, e.g. "jump" or
 *                                      "left".
 * @param {number[]|number} keyCodes    The key code or an array of key codes to
 *                                      register under a control name, e.g. 
 *                                      Phaser.Keyboard.SPACEBAR
 */
Controller.prototype.addKeyboardControl = function (controlName, keyCodes) {
    if (this._controlStates[controlName] === undefined) {
        this._controlStates[controlName] = 0;
    }
    if (!Array.isArray(keyCodes)) keyCodes = [keyCodes];
    for (var i = 0; i < keyCodes.length; i += 1) {
        var key = this._input.keyboard.addKey(keyCodes[i]);
        key.onDown.add(this._onKeyDown, this, 0, controlName);
        key.onUp.add(this._onKeyUp, this, 0, controlName);
    }
};

/**
 * Handle when a key associated with a control is pressed.
 * @private
 */
Controller.prototype._onKeyDown = function (key, controlName) {
    this._controlStates[controlName] += 1;
};

/**
 * Handle when a key associated with a control is released.
 * @private
 */
Controller.prototype._onKeyUp = function (key, controlName) {
    this._controlStates[controlName] -= 1;
};