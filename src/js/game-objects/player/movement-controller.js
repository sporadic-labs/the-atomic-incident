import Controller from "../../helpers/controller.js";
import MOVEMENT_TYPES from "./movement-types.js";

const MAX_SPEED_VALUES = {
  WALK: 200,
  DASH: 600
};

const MAX_ACCELERATION_VALUES = {
  WALK: 3000,
  DASH: 12000
};

const MAX_DRAG_VALUES = {
  WALK: 300,
  DASH: 400
};

export default class MovementContoller {
  constructor(body) {
    this.body = body;
    this.game = body.game;
    this._accelerationFraction = 0;

    // Use this for the dash attack.
    this._fixedAngle;

    this.setMovementType(MOVEMENT_TYPES.WALK);

    const Kb = Phaser.Keyboard;
    this._controls = new Controller(this.game.input);
    this._controls.addKeyboardControl("move-up", [Kb.W, Kb.UP]);
    this._controls.addKeyboardControl("move-left", [Kb.A, Kb.LEFT]);
    this._controls.addKeyboardControl("move-right", [Kb.D, Kb.RIGHT]);
    this._controls.addKeyboardControl("move-down", [Kb.S, Kb.DOWN]);
  }

  /**
   * Invoke this once per frame to move the controller's body based on the current contol input
   * 
   * @memberof MovementContoller
   */
  update() {
    this._controls.update();

    // Calculate the acceleration and heading from the keyboard input
    let acceleration = new Phaser.Point(0, 0);
    if (this._movementType === MOVEMENT_TYPES.WALK) {
      acceleration = this._calculateWalkAcceleration();
    } else if (this._movementType === MOVEMENT_TYPES.DASH) {
      acceleration = this._calculateDashAcceleration(this._fixedAngle);
    }

    // Normalize the acceleration and set the magnitude. This makes it so that the player moves in
    // the same speed in all directions.
    acceleration = acceleration.setMagnitude(this._accelerationFraction * this._maxAcceleration);
    this.body.acceleration.copyFrom(acceleration);

    // Cap the velocity. Phaser physics's max velocity caps the velocity in the x & y dimensions
    // separately. This allows the sprite to move faster along a diagonal than it would along the x
    // or y axis. To fix that, we need to cap the velocity based on it's magnitude.
    if (this.body.velocity.getMagnitude() > this._maxSpeed) {
      this.body.velocity.setMagnitude(this._maxSpeed);
    }

    // Custom drag. Arcade drag runs the calculation on each axis separately. This leads to more
    // drag in the diagonal than in other directions. To fix that, we need to apply drag ourselves.
    // See: https://github.com/photonstorm/phaser/blob/v2.4.8/src/physics/arcade/World.js#L257
    if (acceleration.isZero() && !this.body.velocity.isZero()) {
      const dragMagnitude = this._customDrag * this.game.time.physicsElapsed;
      if (this.body.velocity.getMagnitude() < dragMagnitude) {
        // Snap to 0 velocity so that we avoid the drag causing the velocity to flip directions and
        // end up oscillating
        this.body.velocity.set(0);
      } else {
        // Apply drag in opposite direction of velocity
        const drag = this.body.velocity.clone().setMagnitude(-1 * dragMagnitude);
        this.body.velocity.add(drag.x, drag.y);
      }
    }
  }

  setMovementType(type) {
    this._movementType = type;

    switch (type) {
      case MOVEMENT_TYPES.WALK:
        // Update default settings for this movement type.
        this._maxSpeed = MAX_SPEED_VALUES.WALK;
        this._customDrag = MAX_DRAG_VALUES.WALK;
        this._maxAcceleration = MAX_ACCELERATION_VALUES.WALK;

        break;
      case MOVEMENT_TYPES.DASH:
        // Update default settings for this movement type.
        this._maxSpeed = MAX_SPEED_VALUES.DASH;
        this._customDrag = MAX_DRAG_VALUES.DASH;
        this._maxAcceleration = MAX_ACCELERATION_VALUES.DASH;

        break;
      default:
        console.log("No movement type by that name!");
        // If there was an invalid movement type provided, default to Walk...

        this._maxSpeed = MAX_SPEED_VALUES.WALK;
        this._customDrag = MAX_DRAG_VALUES.WALK;
        this._maxAcceleration = MAX_ACCELERATION_VALUES.WALK;

        this._movementType = MOVEMENT_TYPES.WALK;
        break;
    }
  }

  setFixedAngle(angle) {
    this._fixedAngle = angle;
  }

  removeFixedAngle() {
    this._fixedAngle = null;
  }

  _calculateWalkAcceleration() {
    const accelMod = 1;
    let accel = new Phaser.Point(0, 0);
    const moveLeft = this._controls.isControlActive("move-left");
    const moveRight = this._controls.isControlActive("move-right");
    const moveUp = this._controls.isControlActive("move-up");
    const moveDown = this._controls.isControlActive("move-down");

    if (moveLeft) {
      accel.x += -accelMod;
    } else if (moveRight) {
      accel.x += accelMod;
    }

    if (moveUp) {
      accel.y += -accelMod;
    } else if (moveDown) {
      accel.y += accelMod;
    }

    if (moveLeft || moveRight || moveUp || moveDown) {
      this._accelerationFraction += 3 * this.game.time.physicsElapsed;
      if (this._accelerationFraction > 1) this._accelerationFraction = 1;
    } else {
      this._accelerationFraction = 0;
    }

    return accel;
  }

  _calculateDashAcceleration(angle) {
    const accelMod = 42;

    let accel = new Phaser.Point(0, 0);
    accel.x = Math.cos(angle) * accelMod;
    accel.y = Math.sin(angle) * accelMod;

    return accel;
  }
}
