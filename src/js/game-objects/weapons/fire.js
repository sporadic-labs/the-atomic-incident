module.exports = Fire;

Fire.prototype = Object.create(Phaser.Sprite.prototype);

function Fire(game, x, y) {
    Phaser.Sprite.call(this, game, x, y, "assets", "enemy01/die-02");
    this.anchor.set(0.5);

    this._initialPos = this.position.clone();

    // Configure physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
}

Fire.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
