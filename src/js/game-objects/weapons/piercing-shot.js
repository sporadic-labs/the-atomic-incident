import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class PiercingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.PIERCING_SHOT, 15, 300, 1000);
    this._damage = 40;
    this._speed = 320;

    this._fireSound = game.globals.soundManager.add("chiptone/piercing-fire");
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      this._createProjectile(angle, 24, this._speed);
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

  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    const p = Projectile.makePiercing(this.game, x, y, this, player, this._damage, angle, speed);
    p.scale.setTo(0.8, 1.2);
  }
}
