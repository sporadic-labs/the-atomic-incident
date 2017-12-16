// MH: if we end up using a component pattern often, we may want to create a BaseComponent class
// that enforces that components have the standard lifecycle methods of update/destroy/etc.

import { arcadeRecursiveCollide } from "../../../helpers/sprite-utilities.js";

export default class TargetingComponent {
  constructor(parent, speed, visionRadius = null) {
    this.game = parent.game;
    this.parent = parent;
    this.speed = speed;
    this.target = this.game.globals.player;
    this._visionRadius = visionRadius;
    this._mapManager = this.game.globals.mapManager;
  }

  update() {
    this.game.physics.arcade.collide(this, this._mapManager.wallLayer);
    arcadeRecursiveCollide(this.parent, this.game.globals.groups.enemies);

    // Stop moving
    this.parent.body.velocity.set(0);

    // Vision check, stop early if target is out of range
    if (this._visionRadius !== null) {
      const d = this.parent.position.distance(this.target.position);
      // NOTE(rex): What is this._target?
      if (d > this._visionRadius) return this._target;
    }

    // Calculate path
    const path = this._mapManager.navMesh.findPath(this.parent.position, this.target.position);

    // Check if there is a path that was found
    if (path) {
      if (path.length > 1) {
        // If there are multiple steps in the path, head towards the second
        // point. This allows the sprite to skip the tile it is currently in.
        const nextNode = path[1];
        const nextTargetPoint = new Phaser.Point(nextNode.x, nextNode.y);
        this._moveTowards(nextTargetPoint);
      } else {
        // If there aren't multiple steps, sprite is close enough to directly head
        // for the target itself
        this._moveTowards(this.target.position);
      }
    }

    return this.target;
  }

  _moveTowards(position) {
    const angle = this.parent.position.angle(position);

    // Move towards target
    const distance = this.parent.position.distance(position);
    const targetSpeed = distance / this.game.time.physicsElapsed;
    const magnitude = Math.min(this.speed, targetSpeed);
    this.parent.body.velocity.x = magnitude * Math.cos(angle);
    this.parent.body.velocity.y = magnitude * Math.sin(angle);

    // Rotate towards target
    this.parent.rotation = angle + Math.PI / 2;
  }

  destroy() {
    // Nothing special to destroy
  }
}
