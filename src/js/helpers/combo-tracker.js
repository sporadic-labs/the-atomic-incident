module.exports = ComboTracker;

var utils = require("../../helpers/utilities.js");

function ComboTracker(game, comboTimeout) {
    this._combo = 0;

    this._comboTimeout = utils.default(comboTimeout, 2000);
    this._comboTimer = game.time.create(false); // Doesn't autodestroy
    this._comboTimer.start();
    this._signal = new Phaser.Signal();
}

ComboTracker.prototype.addListener = function (callback, context) {
    this._signal.add(callback, context);
};

ComboTracker.prototype.getCombo = function () {
    return this._combo;
};

ComboTracker.prototype.incrementCombo = function (increment) {
    // Update the combo
    increment = utils.default(increment, 1);
    this._setCombo(this._combo + increment);
    
    // Reset the timer events and schedule an event to reset the combo to zero
    this._comboTimer.removeAll();
    this._comboTimer.add(this._comboTimeout, this._setCombo.bind(this, 0));
};

ComboTracker.prototype.destroy = function () {
    this._comboTimer.destroy();
};

ComboTracker.prototype._setCombo = function (newCombo) {
    this._combo = newCombo;
    this._signal.dispatch(this._combo);
};