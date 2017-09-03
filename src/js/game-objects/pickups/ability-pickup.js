const abilities = require("../../constants/ability-names");

class AbilityPickup extends Phaser.Sprite {
  constructor(game, x, y, parentGroup, abilityName) {
    let frame = null;
    if (abilityName === abilities.DASH) frame = "pickups/dash";
    else if (abilityName === abilities.SLOW_MOTION) frame = "pickups/slow-motion";
    else if (abilityName === abilities.GHOST) frame = "pickups/ghost";

    super(game, x, y, "assets", frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.abilityName = abilityName;

    // Configure physics
    game.physics.arcade.enable(this);
    this.satBody = game.globals.plugins.satBody.addBoxBody(this);

    // If the level has changed, make sure the pickup is not inside of a wall
    this._levelManager = game.globals.levelManager;
    this._levelManager.levelChangeSignal.add(this._checkCollision, this);
  }

  _checkCollision() {
    const wallLayer = this.game.globals.levelManager.getCurrentWallLayer();

    // Get all colliding tiles that are within range and destroy if there are any
    const pad = 10;
    const tiles = wallLayer.getTiles(
      this.position.x - pad,
      this.position.y - pad,
      this.width + pad,
      this.height + pad,
      true
    );
    if (tiles.length > 0) this.destroy();
  }

  pickUp() {
    this.destroy();
  }

  destroy() {
    this._levelManager.levelChangeSignal.remove(this._checkCollision, this);
    super.destroy(...arguments);
  }
}

module.exports = AbilityPickup;
