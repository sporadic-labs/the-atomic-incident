import Color from "../../helpers/color";

const BaseEnemy = require("./base-enemy.js");

import EnergyPickup from "../pickups/energy-pickup";

class ShadowEnemy extends BaseEnemy {
  constructor(game, x, y, atlasKey, parentGroup, color) {
    super(game, x, y, "assets", atlasKey, 100, parentGroup, 1, color);

    // Temp fix: move the health bar above the shadow/light layer
    game.globals.groups.foreground.add(this._healthBar);

    this._movementComponent = null;
    this._inGhostMode = false;

    this._damage = 10; // 10 units per second

    // Override from BaseEnemy
    const diameter = 0.1 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);
    this.body.collideWorldBounds = true;
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);

    this._dieSound = this.game.globals.soundManager.add("pop");
    this._dieSound.playMultiple = true;

    // If the level has changed, make sure the enemy is not inside of a wall
    this._levelManager = game.globals.levelManager;
    this._levelManager.levelChangeSignal.add(this._checkCollision, this);

    this._timer = game.time.create(false);
    this._timer.start();
  }

  _checkCollision() {
    const wallLayer = this._levelManager.getCurrentWallLayer();

    // Get all colliding tiles that are within range and destroy if there are any
    const pad = 0;
    const tiles = wallLayer.getTiles(
      this.position.x - pad,
      this.position.y - pad,
      this.width + pad,
      this.height + pad,
      true
    );
    if (tiles.length > 0) this.destroy();
  }

  update() {
    // If the enemy hasn't spawned yet, don't move or attack!
    if (!this._spawned) return;

    // Collisions with the tilemap
    const lm = this.game.globals.levelManager;
    this.game.physics.arcade.collide(this, lm.getCurrentWallLayer());

    if (this._movementComponent) this._movementComponent.update();
    super.update();
  }

  destroy(...args) {
    // Spawn pickup
    const pickupGroup = this.game.globals.groups.pickups;
    new EnergyPickup(this.game, this.position.x, this.position.y, pickupGroup, 15, 3);

    this._timer.destroy();
    this._levelManager.levelChangeSignal.remove(this._checkCollision, this);
    this._dieSound.play();

    if (this._movementComponent) this._movementComponent.destroy();
    super.destroy(...args);
  }

  setMovementComponent(newComponent) {
    if (this._movementComponent) this._movementComponent.destroy();
    this._movementComponent = newComponent;
  }

  getMovementComponent() {
    return this._movementComponent;
  }
}

module.exports = ShadowEnemy;
