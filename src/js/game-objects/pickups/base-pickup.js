module.exports = BasePickup;

BasePickup.prototype = Object.create(Phaser.Sprite.prototype);
BasePickup.prototype.constructor = BasePickup;

function BasePickup(game, x, y, key, frame, parentGroup, category, scoreSignal, 
    pointValue, physicsConfig) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._category = category;
    this._initialPos = this.position.clone();
    this._startTime = this.game.time.now;
    this._scoreSignal = scoreSignal;
    this._pointValue = (pointValue === undefined) ? pointValue : 0;

    // Configure physics
    physicsConfig = physicsConfig || {};
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
