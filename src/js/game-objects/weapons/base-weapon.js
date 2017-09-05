export default class BaseWeapon extends Phaser.Group {
  constructor(game, parentGroup, weaponName, player) {
    super(game, parentGroup, weaponName);

    this._name = weaponName;
    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._ableToAttack = true;
  }

  /**
   * Setup ammo amount, time between shots, and time for reload.
   * 
   * @param {any} totalAmmo 
   * @param {any} cooldownTime 
   * @param {any} reloadTime 
   * @memberof BaseWeapon
   */
  init(totalAmmo, cooldownTime, reloadTime) {
    // Ammo amounts.
    this._totalAmmo = totalAmmo;
    this._currentAmmo = totalAmmo;
    // Time between shots.
    this._cooldownTime = cooldownTime;
    // Time for reload.
    this._reloadTime = reloadTime;
    this._isReloading = false;
  }

  isAbleToAttack() {
    return this._ableToAttack;
  }

  _reload() {
    if (!this._ableToAttack) return;
    this._isReloading = true;
    this._ableToAttack = false;
    // Start reload animation in HUD.
    this.game.globals.hud.startHudReloadAnimation(this._reloadTime);
    // TODO(rex): Reload animation for the weapon.
    this._cooldownTimer.add(this._reloadTime, () => {
      this.fillAmmo();
      this._ableToAttack = true;
      this._isReloading = false;
    });
  }

  _startCooldown(time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    this._cooldownTimer.add(
      time,
      function() {
        this._ableToAttack = true;
      },
      this
    );
  }

  incrementAmmo(amt) {
    if (this._totalAmmo > this._currentAmmo + amt && this._currentAmmo + amt >= 0) {
      this._currentAmmo += amt;
    } else if (this._totalAmmo <= this._currentAmmo + amt) {
      this._currentAmmo = this._totalAmmo;
    } else if (0 > this._currentAmmo + amt) {
      this._currentAmmo = 0;
    }
  }

  getAmmo() {
    return this._currentAmmo;
  }

  fillAmmo() {
    this._currentAmmo = this._totalAmmo;
  }

  emptyAmmo() {
    this._currentAmmo = 0;
  }

  isAmmoEmpty() {
    return this._currentAmmo <= 0;
  }

  destroy(...args) {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    super.destroy(...args);
  }
}
