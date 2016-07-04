module.exports = BaseWeapon;

BaseWeapon.prototype = Object.create(Phaser.Group.prototype);

function BaseWeapon(game, parentGroup, weaponName, player, cooldownTime, 
    specialCooldownTime) {
    Phaser.Group.call(this, game, parentGroup, weaponName);

    this._name = weaponName;
    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = cooldownTime; // Milliseconds 
    this._specialCooldownTime = specialCooldownTime; // Milliseconds 
    this._ableToAttack = true;
}

BaseWeapon.prototype.isAbleToAttack = function () {
    return this._ableToAttack;
};

BaseWeapon.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
    }, this);
};

BaseWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};