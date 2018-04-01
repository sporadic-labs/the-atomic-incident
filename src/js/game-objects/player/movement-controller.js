import Controller from "../../helpers/controller.js";
import CooldownAbility from "./cooldown-ability";

const MOVEMENT_TYPES = {
  WALK: "WALK",
  BOOST: "BOOST",
  DASH: "DASH"
};

const dashExtraInvincibilityTime = 150;

export default class MovementContoller {
  constructor(player) {
    this.body = player.body;
    this.player = player;
    this.game = this.body.game;
    this.difficultyModifier = this.game.globals.difficultyModifier;

    this.body.setDrag(0.99);

    this._dashAngle = null;

    this._movementType = MOVEMENT_TYPES.WALK;

    const Kb = Phaser.Keyboard;
    this._controls = new Controller(this.game.input);
    this._controls.addKeyboardControl("move-up", [Kb.W, Kb.UP]);
    this._controls.addKeyboardControl("move-left", [Kb.A, Kb.LEFT]);
    this._controls.addKeyboardControl("move-right", [Kb.D, Kb.RIGHT]);
    this._controls.addKeyboardControl("move-down", [Kb.S, Kb.DOWN]);
    this._controls.addKeyboardControl("dash", Phaser.Keyboard.SPACEBAR);

    const game = this.player.game;
    this._dashCooldown = new CooldownAbility(game, 2000, 400, "dash");
    this._timer = game.time.create(false);
    this._timer.start();

    this.player.events.onDestroy.addOnce(this.destroy, this);
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
      this.player.setInvulnerability(true);
      const mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
      this._dashAngle = this.body.position.angle(mousePos);
      this._movementType = MOVEMENT_TYPES.DASH;
      this._dashCooldown.onDeactivation.addOnce(() => {
        this._movementType = MOVEMENT_TYPES.WALK;
        this._dashAngle = null;
        this._timer.add(dashExtraInvincibilityTime, () => this.player.setInvulnerability(false));
      }, this);
    }

    const multiplier = this.difficultyModifier.getSpeedMultiplier();

    // Calculate the acceleration and heading from the keyboard input
    let acceleration = new Phaser.Point(0, 0);
    if (this._movementType === MOVEMENT_TYPES.WALK) {
      this.body.setMaxSpeed(250 * multiplier);
      this._calculateWalkAcceleration(acceleration, 3000 * multiplier);
    } else if (this._movementType === MOVEMENT_TYPES.BOOST) {
      this.body.setMaxSpeed(400 * multiplier);
      this._calculateWalkAcceleration(acceleration, 10000 * multiplier);
    } else if (this._movementType === MOVEMENT_TYPES.DASH) {
      this.body.setMaxSpeed(600 * multiplier);
      this._calculateDashAcceleration(this._dashAngle, acceleration, 12000 * multiplier);
    }
    this.body.acceleration.copyFrom(acceleration);
  }

  startBoost(duration) {
    if (this._movementType === MOVEMENT_TYPES.WALK) {
      this._movementType = MOVEMENT_TYPES.BOOST;
      if (duration !== undefined) this._timer.add(duration, this.stopBoost, this);
    }
  }

  stopBoost() {
    if (this._movementType === MOVEMENT_TYPES.BOOST) {
      this._movementType = MOVEMENT_TYPES.WALK;
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

    acceleration = acceleration.setMagnitude(accelerationMagnitude);
    return acceleration;
  }

  _calculateDashAcceleration(angle, acceleration = new Phaser.Point(0, 0), accelerationMagnitude) {
    acceleration.x = Math.cos(angle) * accelerationMagnitude;
    acceleration.y = Math.sin(angle) * accelerationMagnitude;
    return acceleration;
  }

  destroy() {
    this._timer.destroy();
    this._dashCooldown.destroy();
  }
}
