module.exports = Reticule;

Reticule.prototype = Object.create(Phaser.Sprite.prototype);

function Reticule(game, parentGroup) {
  Phaser.Sprite.call(this, game, 0, 0, "assets", "hud/reticule");
  this.anchor.set(0.5);
  parentGroup.add(this);

  this._updatePosition();
}

Reticule.prototype._updatePosition = function() {
  var newPos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
  this.position.copyFrom(newPos);
};

Reticule.prototype.update = function() {
  this._updatePosition();
};
