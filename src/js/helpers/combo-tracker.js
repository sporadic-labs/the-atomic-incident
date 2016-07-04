module.exports = ComboTracker;

var utils = require("../helpers/utilities.js");

function ComboTracker(game, comboTimeout) {
    this._combo = 0;

    this._comboTimeout = utils.default(comboTimeout, 2000);
    this._comboTimer = game.time.create(false); // Doesn't autodestroy
    this._comboTimer.start();
}

ComboTracker.prototype.getCombo = function () {
    return this._combo;
};

ComboTracker.prototype.incrementCombo = function (increment) {
    // Update the combo
    this._combo += utils.default(increment, 1);
    
    // Reset the timer events and schedule an event to reset the combo to zero
    this._comboTimer.removeAll();
    this._comboTimer.add(this._comboTimeout, function () {
        this._combo = 0;
    }.bind(this));
};

ComboTracker.prototype.destroy = function () {
    this._comboTimer.destroy();
};