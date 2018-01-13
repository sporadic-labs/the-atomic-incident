import { arcadeRecursiveCollide } from "../../../helpers/sprite-utilities.js";

const MOVE_STATES = {
  WALK: "WALK",
  TARGET: "TARGET",
  ATTACK: "ATTACK"
};

export default class MoveTargetAttackComponent {
  constructor(parent, speed, visionRadius = null) {
    this.game = parent.game;
    this.parent = parent;
    this.speed = speed;
    // NOTE(rex): Attack speed is 2x default speed.
    this.attackSpeed = speed * 2;
    this.target = this.game.globals.player;
    this._visionRadius = visionRadius;
    this._mapManager = this.game.globals.mapManager;
    this._moveState = MOVE_STATES.WALK;

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._minWalkDuration = 500; // ms
    this._targetDuration = 1000; // ms
    this._attackDuration = 800; // ms

    this._isDoingSomething = false;

    this._targetPosition;
    this._targetAngle;
  }

  update() {
    this.game.physics.arcade.collide(this.parent, this._mapManager.wallLayer, () => {
      this._isDoingSomething = false;
    });
    // arcadeRecursiveCollide(this.parent, this.game.globals.groups.enemies);

    // Stop moving
    this.parent.body.velocity.set(0);

    // If the enemy is in light, it is allowed to target the Player.
    // TODO(rex): Introduce some randomness into the way the enemy targets the player.
    if (
      !this.target._playerLight.isPointInShadow(this.parent.position) &&
      this._moveState === MOVE_STATES.WALK &&
      !this._isDoingSomething &&
      this.game.rnd.integerInRange(1, 10) === 1
    ) {
      this._moveState = MOVE_STATES.TARGET;
      this._isDoingSomething = true;
      this._timer.add(this._targetDuration, () => {
        this._isDoingSomething = false;
      });
    }

    if (this._moveState === MOVE_STATES.TARGET && !this._isDoingSomething) {
      this._moveState = MOVE_STATES.ATTACK;
      this._isDoingSomething = true;
      this._targetPosition = this.target.position;
      this._targetAngle = this.parent.position.angle(this.target.position);
      this._timer.add(this._attackDuration, () => {
        this._isDoingSomething = false;
      });
    }

    if (this._moveState === MOVE_STATES.ATTACK && !this._isDoingSomething) {
      this._moveState = MOVE_STATES.WALK;
      this._isDoingSomething = true;
      this._targetPosition = null;
      this._targetAngle = null;
      this._timer.add(this._minWalkDuration, () => {
        this._isDoingSomething = false;
      });
    }

    if (this._moveState === MOVE_STATES.ATTACK && this._targetAngle) {
      // this._moveTowards(this._targetPosition);
      this._moveFixed(this._targetAngle);
    } else {
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
    }

    return this.target;
  }

  _moveTowards(position) {
    const angle = this.parent.position.angle(position);

    // Move towards target
    const distance = this.parent.position.distance(position);
    const targetSpeed = distance / this.game.time.physicsElapsed;

    let speed = this.speed;
    switch (this._moveState) {
      case MOVE_STATES.WALK:
        speed = this.speed;
        break;
      case MOVE_STATES.TARGET:
        speed = 0;
        break;
      case MOVE_STATES.ATTACK:
        speed = this.attackSpeed;
        break;
      default:
        console.log("Invalid move state!");
        break;
    }
    const magnitude = Math.min(speed, targetSpeed);
    this.parent.body.velocity.x = magnitude * Math.cos(angle);
    this.parent.body.velocity.y = magnitude * Math.sin(angle);

    // Rotate towards target
    this.parent.rotation = angle + Math.PI / 2;
  }

  _moveFixed(angle) {
    const speed = this.attackSpeed;
    this.parent.body.velocity.x = speed * Math.cos(angle);
    this.parent.body.velocity.y = speed * Math.sin(angle);

    // Rotate towards target
    this.parent.rotation = angle + Math.PI / 2;
  }

  destroy() {
    this._timer.destroy();
  }
}
