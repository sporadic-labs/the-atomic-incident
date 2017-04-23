module.exports = CooldownAbility;

/**
 * A helper class for abilities that have a cooldown time and/or a duration of
 * time during which they are active. This class has Phaser signals for
 * notifying an observer when the ability is ready/activated/deactivated.
 *
 * @param {Phaser.Game} game
 * @param {number} cooldownTime - the time it takes for an ability to recharge
 * @param {number} activeTime - the duration over which the ability is active
 */
function CooldownAbility(game, cooldownTime, activeTime) {
    this._cooldownTime = cooldownTime;
    this._activeTime = activeTime;
    this._ableToUseAbility = true;
    this._isAbilityActive = false;

    this.onReady = new Phaser.Signal();
    this.onActivation = new Phaser.Signal();
    this.onDeactivation = new Phaser.Signal();

    this._timer = game.time.create(false);
    this._timer.start();
}

CooldownAbility.prototype.activate = function () {
    this.onActivation.dispatch();

    this._ableToUseAbility = false;
    this._timer.add(this._cooldownTime, function () {
        this._ableToUseAbility = true;
        this.onReady.dispatch();
    }, this);
    
    this._isAbilityActive = true;
    this._timer.add(this._activeTime, function () {
        this._isAbilityActive = false;
        this.onDeactivation.dispatch();
    }, this);

    return this._ableToUseAbility;
}

CooldownAbility.prototype.isReady = function () {
    return this._ableToUseAbility;
}

CooldownAbility.prototype.isActive = function () {
    return this._isAbilityActive;
}

CooldownAbility.prototype.progress = function () {
    if (this._isAbilityActive) {
        return (this._activeTime - this._timer.duration) / this._activeTime
    }
    return 1
}

CooldownAbility.prototype.destroy = function () {
    this._timer.destroy();
}