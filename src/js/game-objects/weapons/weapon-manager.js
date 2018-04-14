import Scattershot from "./scattershot";
import RapidFire from "./rapid-fire";
import PiercingShot from "./piercing-shot";
import HomingShot from "./homing-shot";
import RocketLauncher from "./rocket-launcher";
import Flamethrower from "./flamethrower";
import BouncingShot from "./bouncing-shot";
import WEAPON_TYPES from "./weapon-types";
import MountedGun from "./mounted-gun";

export default class WeaponManager extends Phaser.Group {
  constructor(game, parent, player, enemies) {
    super(game, parent, "WeaponManager");
    this._game = game;
    this._player = player;
    this._enemies = enemies;

    this._scattershot = new Scattershot(game, this, player, enemies);
    this._rapidFire = new RapidFire(game, this, player, enemies);
    this._piercingShot = new PiercingShot(game, this, player, enemies);
    this._bouncingShot = new BouncingShot(game, this, player, enemies);
    this._homingShot = new HomingShot(game, this, player, enemies);
    this._rocketLauncher = new RocketLauncher(game, this, player, enemies);
    this._flamethrower = new Flamethrower(game, this, player, enemies);

    this._emptyAmmoSound = game.globals.soundManager.add("out-of-ammo");
    this._allowEmptyAmmoSound = true;
    this._emptyAmmoCooldownTimer = game.time.create(false);
    this._emptyAmmoCooldownTimer.start();

    const x = this._player.position.x;
    const y = this._player.position.y;
    const randomWeaponType = game.rnd.pick(Object.values(WEAPON_TYPES));
    this._mountedGun = new MountedGun(game, x, y, this, player, randomWeaponType);

    this.switchWeapon(randomWeaponType);
  }

  getActiveWeapon() {
    return this._activeWeapon;
  }

  getActiveType() {
    return this._activeWeapon._type;
  }

  isAbleToAttack() {
    if (this._activeWeapon && this._activeWeapon.isAbleToAttack()) return true;
    return false;
  }

  switchWeapon(type) {
    if (type === WEAPON_TYPES.RAPID_FIRE) this._activeWeapon = this._rapidFire;
    else if (type === WEAPON_TYPES.SCATTERSHOT) this._activeWeapon = this._scattershot;
    else if (type === WEAPON_TYPES.PIERCING_SHOT) this._activeWeapon = this._piercingShot;
    else if (type === WEAPON_TYPES.BOUNCING) this._activeWeapon = this._bouncingShot;
    else if (type === WEAPON_TYPES.HOMING_SHOT) this._activeWeapon = this._homingShot;
    else if (type === WEAPON_TYPES.ROCKET_LAUNCHER) this._activeWeapon = this._rocketLauncher;
    else if (type === WEAPON_TYPES.FLAMETHROWER) this._activeWeapon = this._flamethrower;
    // New weapons should start with full ammo.
    this._activeWeapon.fillAmmo();

    this._mountedGun.destroy();
    this._mountedGun = null;
    const x = this._player.position.x;
    const y = this._player.position.y;
    this._mountedGun = new MountedGun(this._game, x, y, this, this._player, type);
    this._mountedGun.visible = false;
  }

  fire(angle = 0) {
    if (this.isAbleToAttack()) {
      this._activeWeapon.fire(angle);
    } else if (this.getActiveWeapon().isAmmoEmpty()) {
      this.outOfAmmo();
    }
  }

  outOfAmmo(time = 500) {
    if (!this._allowEmptyAmmoSound) return;
    this._allowEmptyAmmoSound = false;
    this._emptyAmmoSound.play();
    this._emptyAmmoCooldownTimer.add(time, () => (this._allowEmptyAmmoSound = true), this);
  }

  destroy(...args) {
    // destroy the weapons.
    this._scattershot.destroy();
    this._rapidFire.destroy();
    this._piercingShot.destroy();
    this._bouncingShot.destroy();
    this._homingShot.destroy();
    this._rocketLauncher.destroy();
    this._flamethrower.destroy();

    // destroy the rest of the crap.
    this._mountedGun.destroy();
    this._mountedGun = null;
    this._emptyAmmoCooldownTimer.destroy();
    super.destroy(...args);
  }
}
