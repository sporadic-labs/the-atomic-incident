const STATES = {
  FOLLOWING: "FOLLOWING",
  DASHING: "DASHING",
  STUNNED: "STUNNED",
  CHARGING_UP: "CHARGING_UP"
};

export default class BossDashComponent {
  constructor(
    parent,
    attackSpeed,
    targetingComponent,
    collisionPoints,
    { dashDuration = 2000, chargeUpTime = 3000, stunTime = 0 } = {}
  ) {
    this.game = parent.game;
    this.parent = parent;
    this.attackSpeed = attackSpeed;

    this._targetingComponent = targetingComponent;
    this._mapManager = this.game.globals.mapManager;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._isDashing = false;
    this._chargeUpTime = chargeUpTime;
    this._dashDuration = dashDuration;
    this._stunTime = stunTime;
    this._canDash = true;
    this._dashAngle = null;
    this._previousState = null;
    this._state = STATES.FOLLOWING;

    this._isInLight = false;
    this._enteredLightAt = 0;

    // // Counter-clockwise points (in range [0, 1]) need to be shifted so that the center is in the
    // // middle of the graphic and then scaled to match sprite's scale.
    // const points = collisionPoints.map(p => ({
    //   x: (p[0] - 0.5) * this.parent.width * 0.9,
    //   y: (p[1] - 0.5) * this.parent.height * 0.9
    // }));
    // this.shrunkenSatBody = this.game.globals.plugins.satBody.addPolygonBody(this.parent, points);
    // this.weakPointBody = this.game.physics.sat.add.body({
    //   shape: { type: "polygon", points }
    // });
  }

  /**
   * Check if the parent has been in the light for the specified duration
   * @param {number} duration Time in ms
   */
  hasBeenInLightFor(duration) {
    const player = this._targetingComponent.target;
    const wasInLight = this._isInLight;
    this._isInLight = !player._playerLight.isPointInShadow(this.parent.position);
    if (this._isInLight && !wasInLight) this._enteredLightAt = this._timer.ms;
    return this._isInLight && this._timer.ms - this._enteredLightAt > duration;
  }

  update() {
    const player = this._targetingComponent.target;

    const inLight = this.hasBeenInLightFor(250);
    const justLeftStun = this._previousState === STATES.STUNNED && this._state !== STATES.STUNNED;
    if (!inLight && justLeftStun) {
      this.switchState(STATES.FOLLOWING);
    } else if (inLight && this._state === STATES.FOLLOWING) {
      this.switchState(STATES.CHARGING_UP);
    }

    // Targeting component should take over
    if (this._state === STATES.FOLLOWING) return;

    // Collide with AP regardless of state
    const wallLayer = this._mapManager.wallLayer;
    if (this.game.physics.sat.world.collide(this.parent, wallLayer)) {
      // if (this.checkSatbody) this.switchState(STATES.STUNNED);
    }

    const multiplier = this._difficultyModifier.getSpeedMultiplier();

    switch (this._state) {
      case STATES.DASHING: {
        this.parent.body.velocity.x = multiplier * this.attackSpeed * Math.cos(this._dashAngle);
        this.parent.body.velocity.y = multiplier * this.attackSpeed * Math.sin(this._dashAngle);
        this.parent.rotation = this._dashAngle + Math.PI / 2;
        break;
      }
      case STATES.CHARGING_UP: {
        // This should animate slowly vs immediately jump to the target rotation
        const elapsedSeconds = this.game.time.physicsElapsed;
        const desiredRotation = this.parent.position.angle(player.position) + Math.PI / 2;
        const delta = this.shortAngleDist(this.parent.rotation, desiredRotation);
        const deltaSign = delta < 0 ? -1 : 1;
        const deltaMagnitude = Math.min(Math.abs(delta), this._turnSpeed * elapsedSeconds);
        this.parent.rotation += deltaMagnitude * deltaSign;
        break;
      }
    }

    this._previousState = this._state;
  }

  switchState(newState) {
    if (newState === this._state) return;

    // Leaving last state logic
    switch (this._state) {
      case STATES.FOLLOWING: {
        this._targetingComponent.isActive = false;
        break;
      }
      case STATES.STUNNED: {
        this.stopStun();
        break;
      }
      case STATES.CHARGING_UP: {
        this.stopCharging();
        break;
      }
      case STATES.DASHING: {
        this.stopDash();
        break;
      }
    }

    // Entering new state logic
    switch (newState) {
      case STATES.FOLLOWING: {
        this._targetingComponent.isActive = true;
        break;
      }
      case STATES.STUNNED: {
        this.startStun();
        break;
      }
      case STATES.CHARGING_UP: {
        this.startCharging();
        break;
      }
      case STATES.DASHING: {
        this.startDash();
        break;
      }
    }

    this._state = newState;
  }

  shortAngleDist(a0, a1) {
    const max = Math.PI * 2;
    const da = (a1 - a0) % max;
    return (2 * da) % max - da;
  }

  startStun() {
    this.parent.tint = 0xff0000;
    this.parent.body.velocity.set(0);

    const s = this.parent.baseScale;
    this.game.make
      .tween(this.parent.scale)
      .to({ x: s * 0.95, y: s * 0.95 }, 100, Phaser.Easing.Bounce.In)
      .to({ x: s, y: s }, 100, Phaser.Easing.Bounce.Out)
      .repeatAll(-1)
      .start();

    this._timer.add(
      this._stunTime,
      () => {
        this.game.tweens.removeFrom(this.parent.scale);
        this.switchState(STATES.CHARGING_UP);
      },
      this
    );
  }

  stopStun() {
    this.parent.tint = 0xffffff;
    this._timer.removeAll();
    this.game.tweens.removeFrom(this.parent.scale);
    this.parent.scale.setTo(this.parent.baseScale);
  }

  startCharging() {
    if (this.parent && this.parent.body) {
      this.parent.body.velocity.set(0);
    }
    this._timer.add(this._chargeUpTime, () => this.switchState(STATES.DASHING), this);

    this._turnSpeed = 0.1;
    this.game.make
      .tween(this)
      .to({ _turnSpeed: 2 }, this._chargeUpTime, Phaser.Easing.Exponential.InOut)
      .start();
  }

  stopCharging() {
    this._timer.removeAll();
    this.game.tweens.removeFrom(this);
    this._turnSpeed = 0;
  }

  startDash() {
    const player = this._targetingComponent.target;
    this._dashAngle = this.parent.position.angle(player.position);

    this._timer.add(this._dashDuration, () => this.switchState(STATES.CHARGING_UP), this);

    this.checkSatbody = false;
    this._timer.add(this._dashDuration * 0.1, () => (this.checkSatbody = true));
  }

  stopDash() {
    this._timer.removeAll();
    this.checkSatbody = false;
  }

  destroy() {
    this._timer.destroy();
  }
}
