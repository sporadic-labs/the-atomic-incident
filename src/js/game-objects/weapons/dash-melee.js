import BaseWeapon from "./base-weapon";
import WEAPON_TYPES from "./weapon-types";

export default class DashMelee extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.DASH, 4, 720, 1200);
    this._damage = 25;
    this._maxDistance = 56;
    this._maxSpeed = 120;

    this._dashTime = 240;

    this._dashTimer = this.game.time.create(false);
    this._dashTimer.start();

    this._fireSound = game.globals.soundManager.add("chiptone/dash-melee-fire");
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      this._startDashAttack(angle);
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) {
        this._fireSound.play();
        this._startCooldown(this._cooldownTime);
      } else {
        this._reloadSound.play();
        this._reload();
      }
    }
  }

  _startDashAttack(angle) {
    this._player.startDash(angle);

    this._dashTimer.add(this._dashTime, () => {
      this._player.endDash();
    });
  }

  destroy(...args) {
    this._dashTimer.destroy();
    super.destroy(...args);
  }
}
