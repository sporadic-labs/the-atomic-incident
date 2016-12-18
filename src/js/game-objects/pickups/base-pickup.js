module.exports = BasePickup;

var utils = require("../../helpers/utilities.js");

BasePickup.prototype = Object.create(Phaser.Sprite.prototype);

function BasePickup(game, x, y, key, frame, parentGroup, category, pointValue, life) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._category = category;
    this._initialPos = this.position.clone();
    this._startTime = game.time.now;
    this._pointValue = utils.default(pointValue, 0);
    this._life = utils.default(life, -1);

    this._fading = false; // use to blink when time is running out!
    this._timer = game.time.create(false);
    this._timer.start();

    // Configure physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;

    this.satBody = game.globals.plugins.satBody.addBoxBody(this);
}

BasePickup.prototype.update = function () {
    // If this pickup has 300ms or less left of life, setup a tween to begin
    // blinking.  When the tween animation is complete, destroy the pickup.
    if ((this._life - this._timer.ms <= 300) && !this._fading) {
        this._fading = true;
        var tween = this.game.make.tween(this)
            .to({ alpha: 0.25 }, 300, "Quad.easeInOut", true, 0, 5, true);

        // When tween is over, destroy this pickup
        tween.onComplete.add(function() {
            this.destroy()
        }, this);
    }
};

BasePickup.prototype.killByPlayer = function () {
    this._scoreSignal.dispatch(this._pointValue);
    this.destroy();
};

BasePickup.prototype.destroy = function () {
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
