/**
 * A helper class for abilities that have a cooldown time and/or a duration of
 * time during which they are active. This class has Phaser signals for
 * notifying an observer when the ability is ready/activated/deactivated.
 *
 * @param {Phaser.Game} game
 * @param {number} cooldownTime - the time it takes for an ability to recharge
 * @param {number} activeTime - the duration over which the ability is active
 */
export default class CooldownAbility {
  constructor(game, cooldownTime, activeTime, name) {
    this.name = name;

    this._cooldownTime = cooldownTime;
    this._activeTime = activeTime;
    this._ableToUseAbility = true;
    this._isAbilityActive = false;
    this._startTime = 0;

    this.onReady = new Phaser.Signal();
    this.onActivation = new Phaser.Signal();
    this.onDeactivation = new Phaser.Signal();

    this._timer = game.time.create(false);
    this._timer.start();
  }

  activate() {
    this.onActivation.dispatch();
    this._startTime = this._timer.ms;

    this._ableToUseAbility = false;
    this._timer.add(this._cooldownTime, () => {
      this._ableToUseAbility = true;
      this.onReady.dispatch();
      this._startTime = 0;
    });

    this._isAbilityActive = true;
    this._timer.add(this._activeTime, () => {
      this._isAbilityActive = false;
      this.onDeactivation.dispatch();
    });

    return this._ableToUseAbility;
  }

  isReady() {
    return this._ableToUseAbility;
  }

  isActive() {
    return this._isAbilityActive;
  }

  reset() {
    this._ableToUseAbility = true;
    this._isAbilityActive = false;
    this._timer.clearPendingEvents();
  }

  /** Returns a number between 0 (cooldown hasn't started) and 1 (cooldown complete) */
  getCooldownProgress() {
    if (this._ableToUseAbility) return 1;
    return (this._timer.ms - this._startTime) / this._cooldownTime;
  }

  destroy() {
    this._timer.destroy();
  }
}
