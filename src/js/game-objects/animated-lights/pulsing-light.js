module.exports = PulsingLight;

var Light = require("../../plugins/lighting-plugin/light.js")

PulsingLight.prototype = Object.create(Light.prototype);

function PulsingLight(game, parent, position, shape, color, onTime, offTime) {
    Light.call(this, game, parent, position, shape, color);

    this.game = game;
    this._initialColor = this.color;
    this._onTime = onTime;
    this._offTime = offTime;

    this._lighting = game.globals.plugins.lighting;
    this._lighting.addExistingLight(this);

    this._tweenOff();
}

PulsingLight.prototype._tweenOn = function () {
    this.enabled = true;
    this.game.add.tween({step:0})
        .to({step:1}, this._onTime, Phaser.Easing.Quartic.InOut, true)
        .onUpdateCallback(function (tween, value) {
            this.color = Phaser.Color.interpolateColor(0x000000,
                this._initialColor, 1, value);
        }, this).onComplete.add(function () {
            this._tweenOff();
        }, this);
};

PulsingLight.prototype._tweenOff = function () {
    this.game.add.tween({step:0})
        .to({step:1}, this._offTime, Phaser.Easing.Quartic.InOut, true)
        .onUpdateCallback(function (tween, value) {
            this.color = Phaser.Color.interpolateColor(this._initialColor, 
                0x000000, 1, value);
        }, this).onComplete.add(function () {
            this.enabled = false;
            this._tweenOn();
        }, this);
};

PulsingLight.prototype.destroy = function () {
    clearTimeout(this.pulseTimer);
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    Light.destory.apply(this);
};