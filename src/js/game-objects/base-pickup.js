module.exports = BasePickup;

BasePickup.prototype = Object.create(Phaser.Sprite.prototype);
BasePickup.prototype.constructor = BasePickup;

function BasePickup(game, x, y, parentGroup, type) {
    Phaser.Sprite.call(this, game, x, y, "assets", "diamond");

    this.anchor.set(0.5);
    parentGroup.add(this);

    this._initialPos = this.position.clone();
    this._type = type;

    if (this._type === "gun") {
        var rgb = Phaser.Color.HSLtoRGB(0.74, 0.74, 0.34);
        this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
    } else if (this._type === "laser") {
        var rgb = Phaser.Color.HSLtoRGB(0.52, 0.74, 0.74);
        this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
    }

    this.game.physics.arcade.enable(this);
}
