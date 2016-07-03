module.exports = BasePickup;

var utils = require("../../helpers/utilities.js");

BasePickup.prototype = Object.create(Phaser.Sprite.prototype);

function BasePickup(game, x, y, key, frame, parentGroup, category, pointValue) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._category = category;
    this._initialPos = this.position.clone();
    this._startTime = this.game.time.now;
    this._pointValue = utils.default(pointValue, 0);

    // Configure physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

BasePickup.prototype._applyRandomLightnessTint = function (h, s, l) {
    l += this.game.rnd.realInRange(-0.1, 0.1);
    var rgb = Phaser.Color.HSLtoRGB(h, s, l);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
};

BasePickup.prototype.killByPlayer = function () {
    this._scoreSignal.dispatch(this._pointValue);
    this.destroy();
};
