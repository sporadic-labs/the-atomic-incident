import { arcadeRecursiveCollide } from "../../../helpers/sprite-utilities.js";

const STATES = {
  FOLLOWING: "FOLLOWING",
  DASHING: "DASHING",
  CHARGING_UP: "CHARGING_UP"
};

export default class DashAttackComponent {
  constructor(
    parent,
    attackSpeed,
    targetingComponent,
    { dashDuration = 800, chargeUpTime = 1000 } = {}
  ) {
    this.game = parent.game;
    this.parent = parent;
    this.attackSpeed = attackSpeed;

    this._targetingComponent = targetingComponent;
    this._mapManager = this.game.globals.mapManager;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._isDashing = false;
    this._chargeUpTime = chargeUpTime;
    this._dashDuration = dashDuration;
    this._canDash = true;
    this._dashAngle = null;
    this._state = STATES.FOLLOWING;

    this._isInLight = false;
    this._enteredLightAt = 0;
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
    if (!inLight && this._state !== STATES.DASHING) {
      // Only switch to targeting if enemy isn't already committed to a dash attack
      this._state = STATES.FOLLOWING;
    } else if (inLight && this._state === STATES.FOLLOWING) {
      this.startCharging();
    }

    // Update the targing component & escape early if following
    if (this._state === STATES.FOLLOWING) {
      this._targetingComponent.isActive = true;
      return;
    } else {
      this._targetingComponent.isActive = false;
    }

    this.game.physics.arcade.collide(this.parent, this._mapManager.wallLayer, () => {
      this.startCharging();
    });

    if (this._state === STATES.DASHING) {
      this.parent.body.velocity.x = this.attackSpeed * Math.cos(this._dashAngle);
      this.parent.body.velocity.y = this.attackSpeed * Math.sin(this._dashAngle);
      this.parent.rotation = this._dashAngle + Math.PI / 2;
    } else if (this._state === STATES.CHARGING_UP) {
      // This should animate slowly vs immediately jump to the target rotation
      this.parent.rotation = this.parent.position.angle(player.position) + Math.PI / 2;
    }
  }

  startCharging() {
    this._state = STATES.CHARGING_UP;
    this._timer.removeAll();
    this._timer.add(this._chargeUpTime, this.startDash, this);
  }

  startDash() {
    const player = this._targetingComponent.target;
    this._dashAngle = this.parent.position.angle(player.position);
    this._state = STATES.DASHING;

    this._timer.removeAll();
    this._timer.add(this._dashDuration, this.startCharging, this);
  }

  destroy() {
    this._timer.destroy();
  }
}
