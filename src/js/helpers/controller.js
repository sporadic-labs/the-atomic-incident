/**
 * @module Controller
 */
module.exports = Controller;

/**
 * This object can be used to look up the mouse button property that corresponds
 * with the button's numerical ID.
 * @type {Object}
 */
var POINTER_BUTTONS_LOOKUP = {};
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.LEFT_BUTTON] = "leftButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.MIDDLE_BUTTON] = "middleButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.RIGHT_BUTTON] = "rightButton";
    
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

    // Object containing the active control names. If a control is active, this
    // will have a property (that control's name) set to true. Inactive controls
    // are not stored in the object.
    this._activeControls = {};

    // Objects containing the mapping of: 
    //  keyCode/mouseButton -> control name
    this._keyboardMap = {};
    this._mouseMap = {};
}

/**
 * Check what controls are active. This must be called once per frame, before
 * Controller.isControlActive.
 */
Controller.prototype.update = function () {
    // Reset controls
    this._activeControls = {};
    
    // Check for any registered mouse controls that have been activated
    var activePointer = this._input.activePointer;
    for (var buttonName in this._mouseMap) {
        var mouseControls = this._mouseMap[buttonName];
        var buttonPropertyName = POINTER_BUTTONS_LOOKUP[buttonName];
        var pointerButton = activePointer[buttonPropertyName];
        if (pointerButton.isDown) {
            this._activateControls(mouseControls);
        }
    }

    // Check for any registered keyboard controls that have been activated
    for (var keyCode in this._keyboardMap) {
        var keyboardControls = this._keyboardMap[keyCode];
        if (this._input.keyboard.isDown(keyCode)) {
            this._activateControls(keyboardControls);
        }
        // TODO: isDown(...) only works in browsers. Make this mobile-friendly.
    }
};

/**
 * Check whether a specified control is currently active.
 * @param  {string}  controlName The name of the control which was registered in
 *                               Controller.addKey.
 * @return {Boolean}             Whether or not the control is active.
 */
Controller.prototype.isControlActive = function (controlName) {
    return (this._activeControls[controlName] === true);
};

/**
 * Register a key or keys under a control name.
 * @param {string}          controlName The name of the control, e.g. "jump" or
 *                                      "left".
 * @param {number[]|number} keyCodes    The key code or an array of key codes to
 *                                      register under the specified control 
 *                                      name, e.g. Phaser.Keyboard.SPACEBAR
 */
Controller.prototype.addKeyboardControl = function (controlName, keyCodes) {
    if (!Array.isArray(keyCodes)) keyCodes = [keyCodes];
    for (var i = 0; i < keyCodes.length; i += 1) {
        var keyCode = keyCodes[i];
        if (this._keyboardMap[keyCode]) {
            this._keyboardMap[keyCode].push(controlName);
        } else {
            this._keyboardMap[keyCode] = [controlName];
        }
    }
};

/**
 * Register a mouse button under a control name.
 * @param {string} controlName The name of the control, e.g. "jump" or "left".
 * @param {number} mouseButton The phaser mouse button to register under the 
 *                             specified control name, e.g. 
 *                             Phaser.Pointer.LEFT_BUTTON.
 */
Controller.prototype.addMouseDownControl = function (controlName, mouseButton) {
    if (this._mouseMap[mouseButton]) {
        this._mouseMap[mouseButton].push(controlName);
    } else {
        this._mouseMap[mouseButton] = [controlName];
    }
};

/**
 * Activate the array of controls specified
 * @param  {string[]} controls Array of controls to active
 * @private
 */
Controller.prototype._activateControls = function (controls) {
    for (var i = 0; i < controls.length; i += 1) {
        var controlName = controls[i];
        this._activeControls[controlName] = true;
    }
};
