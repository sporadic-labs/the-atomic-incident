import Controller from "../../helpers/controller.js";
import CooldownAbility from "./cooldown-ability";

const MOVEMENT_TYPES = {
  WALK: "WALK",
  DASH: "DASH"
};

export default class MovementContoller {
  constructor(body) {
    this.body = body;
    this.game = body.game;

    body.setDrag(0.99);

    this._dashAngle = null;

    this.setMovementType(MOVEMENT_TYPES.WALK);

    const Kb = Phaser.Keyboard;
    this._controls = new Controller(this.game.input);
    this._controls.addKeyboardControl("move-up", [Kb.W, Kb.UP]);
    this._controls.addKeyboardControl("move-left", [Kb.A, Kb.LEFT]);
    this._controls.addKeyboardControl("move-right", [Kb.D, Kb.RIGHT]);
    this._controls.addKeyboardControl("move-down", [Kb.S, Kb.DOWN]);
    this._controls.addKeyboardControl("dash", Phaser.Keyboard.SPACEBAR);

    this._dashCooldown = new CooldownAbility(body.game, 2000, 200, "dash");
  }

  /**
   * Invoke this once per frame to move the controller's body based on the current contol input
   *
   * @memberof MovementContoller
   */
  update() {
    this._controls.update();

    if (this._controls.isControlActive("dash") && this._dashCooldown.isReady()) {
      this._dashCooldown.activate();
      const mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
      this._dashAngle = this.body.position.angle(mousePos);
      this.setMovementType(MOVEMENT_TYPES.DASH);
      this._dashCooldown.onDeactivation.addOnce(() => {
        this.setMovementType(MOVEMENT_TYPES.WALK);
        this._dashAngle = null;
      }, this);
    }

    // Calculate the acceleration and heading from the keyboard input
    let acceleration = new Phaser.Point(0, 0);
    if (this._movementType === MOVEMENT_TYPES.WALK) {
      this._calculateWalkAcceleration(acceleration);
    } else if (this._movementType === MOVEMENT_TYPES.DASH) {
      this._calculateDashAcceleration(this._dashAngle, acceleration, this._maxAcceleration);
    }
    this.body.acceleration.copyFrom(acceleration);
  }

  setMovementType(type) {
    this._movementType = type;

    switch (type) {
      case MOVEMENT_TYPES.WALK:
        this.body.setMaxSpeed(200);
        break;
      case MOVEMENT_TYPES.DASH:
        this.body.setMaxSpeed(600);
        break;
      default:
        console.log("No movement type by that name!");
        this.body.setMaxSpeed(200);
        this._movementType = MOVEMENT_TYPES.WALK;
        break;
    }
  }

  isMoving() {
    return !this.body.velocity.isZero();
  }

  isDashing() {
    return this._dashAngle !== null;
  }

  getSpeedFraction() {
    return this.body.velocity.getMagnitude() / this.body.maxSpeed;
  }

  _calculateWalkAcceleration(acceleration = new Phaser.Point(0, 0), accelerationMagnitude) {
    const moveLeft = this._controls.isControlActive("move-left");
    const moveRight = this._controls.isControlActive("move-right");
    const moveUp = this._controls.isControlActive("move-up");
    const moveDown = this._controls.isControlActive("move-down");

    if (moveLeft) {
      acceleration.x = -1;
    } else if (moveRight) {
      acceleration.x = 1;
    }

    if (moveUp) {
      acceleration.y = -1;
    } else if (moveDown) {
      acceleration.y = 1;
    }

    acceleration = acceleration.setMagnitude(3000);
    return acceleration;
  }

  _calculateDashAcceleration(angle, acceleration = new Phaser.Point(0, 0)) {
    acceleration.x = Math.cos(angle) * 12000;
    acceleration.y = Math.sin(angle) * 12000;
    return acceleration;
  }
}
