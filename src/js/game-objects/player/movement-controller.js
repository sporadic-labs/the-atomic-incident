import Controller from "../../helpers/controller.js";

export default class MovementContoller {
  constructor(body, maxSpeed = 50, maxAcceleration = 5000, drag = 1000) {
    this.body = body;
    this.game = body.game;
    this._maxSpeed = maxSpeed;
    this._customDrag = drag;
    this._maxAcceleration = maxAcceleration;

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
    if (this._controls.isControlActive("move-left")) {
      acceleration.x += -1;
    } else if (this._controls.isControlActive("move-right")) {
      acceleration.x += 1;
    }
    if (this._controls.isControlActive("move-up")) {
      acceleration.y += -1;
    } else if (this._controls.isControlActive("move-down")) {
      acceleration.y += 1;
    }

    // Normalize the acceleration and set the magnitude. This makes it so that the player moves in
    // the same speed in all directions.
    acceleration = acceleration.setMagnitude(this._maxAcceleration);
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
}
