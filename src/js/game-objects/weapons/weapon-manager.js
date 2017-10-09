import Scattershot from "./scattershot";
import RapidFire from "./rapid-fire";
import PiercingShot from "./piercing-shot";
import HomingShot from "./homing-shot";
import WEAPON_TYPES from "./weapon-types";

export default class WeaponManager extends Phaser.Group {
  constructor(game, parent, player, enemies) {
    super(game, parent, "WeaponManager");
    this._player = player;
    this._enemies = enemies;

    this._scattershot = new Scattershot(game, this, player, enemies);
    this._rapidFire = new RapidFire(game, this, player, enemies);
    this._piercingShot = new PiercingShot(game, this, player, enemies);
    this._homingShot = new HomingShot(game, this, player, enemies);
    this.switchWeapon(this.game.rnd.pick(Object.values(WEAPON_TYPES)));
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
    else if (type === WEAPON_TYPES.HOMING_SHOT) this._activeWeapon = this._homingShot;
  }

  fire() {
    const mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    const angle = this._player.position.angle(mousePos);
    this._activeWeapon.fire(angle);
  }
}
