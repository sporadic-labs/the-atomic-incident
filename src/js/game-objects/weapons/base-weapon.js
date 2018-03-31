import { getFormattedType } from "./weapon-types";
// import MountedGun from "./mounted-gun";

export default class BaseWeapon extends Phaser.Group {
  constructor(game, parentGroup, player, enemies, weaponType, totalAmmo, cooldownTime, reloadTime) {
    super(game, parentGroup, weaponType);

    this._type = weaponType;
    this._player = player;
    this._enemies = enemies;
    this._ableToAttack = true;
    this._totalAmmo = totalAmmo;
    this._currentAmmo = totalAmmo;
    this._cooldownTime = cooldownTime;
    this._reloadTime = reloadTime;
    this._isReloading = false;

    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
  }

  isReloading() {
    return this._isReloading;
  }

  getMaxAmmo() {
    return this._totalAmmo;
  }

  getName() {
    return getFormattedType(this._type);
  }

  isAbleToAttack() {
    return this._ableToAttack && !this.isAmmoEmpty();
  }

  _reload() {
    if (!this._ableToAttack) return;
    this._isReloading = true;
    this._ableToAttack = false;
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
    this._cooldownTimer.add(time, () => (this._ableToAttack = true), this);
  }

  incrementAmmo(amt) {
    this._currentAmmo += amt;
    if (this._currentAmmo > this._totalAmmo) this._currentAmmo = this._totalAmmo;
    if (this._currentAmmo < 0) this._currentAmmo = 0;
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

  getType() {
    return this._type;
  }

  destroy(...args) {
    this._cooldownTimer.destroy();
    super.destroy(...args);
  }
}
