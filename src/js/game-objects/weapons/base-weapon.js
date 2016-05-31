module.exports = BaseWeapon;

BaseWeapon.prototype = Object.create(Phaser.Group.prototype);
BaseWeapon.prototype.constructor = BaseWeapon;

function BaseWeapon(game, parentGroup, weaponName, player, enemies, 
    cooldownTime, specialCooldownTime, comboTracker) {
    Phaser.Group.call(this, game, parentGroup, weaponName);

    this._name = weaponName;
    this._player = player;
    this._enemies = enemies;
    this._comboTracker = comboTracker;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = cooldownTime; // Milliseconds 
    this._ableToAttack = true;

    this._specialCooldownTimer = this.game.time.create(false);
    this._specialCooldownTimer.start();
    this._specialCooldownTime = specialCooldownTime; // Milliseconds 
    this._ableToAttackSpecial = true;
}

BaseWeapon.prototype.isAbleToAttack = function () {
    return this._ableToAttack;
};

BaseWeapon.prototype._startCooldown = function () {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    this._cooldownTimer.add(this._cooldownTime, function () {
        this._ableToAttack = true;
    }, this);
};

BaseWeapon.prototype.isAbleToAttackSpecial = function () {
    return this._ableToAttackSpecial;
};

BaseWeapon.prototype._startSpecialCooldown = function () {
    if (!this._ableToAttackSpecial) return;
    this._ableToAttackSpecial = false;
    this._specialCooldownTimer.add(this._specialCooldownTime, function () {
        this._ableToAttackSpecial = true;
    }, this);
};

BaseWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();
    this._specialCooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};