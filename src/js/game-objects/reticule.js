module.exports = Reticule;

Reticule.prototype = Object.create(Phaser.Sprite.prototype);
Reticule.prototype.constructor = Reticule;

function Reticule(game, player, parentGroup) {
    Phaser.Sprite.call(this, game, 0, 0, "assets", "reticule");
    this.anchor.set(0.5);
    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    // We don't need this yet, but the reticle will eventually need to talk to
    // the player
    this._player = player;

    this._updatePosition();
}

Reticule.prototype._updatePosition = function() {
    var newPos = Phaser.Point.add(this.game.camera.position, 
        this.game.input.activePointer);
    this.position.copyFrom(newPos);
}

Reticule.prototype.update = function () {
    this._updatePosition();
};