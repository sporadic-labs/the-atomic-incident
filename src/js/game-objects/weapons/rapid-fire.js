import BaseWeapon from "./base-weapon";
import Projectile from "./projectile";
import WEAPON_TYPES from "./weapon-types";

export default class RapidFire extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.RAPID_FIRE, 100, 25, 1800);
    this._damage = 10;
    this._speed = 500;

    this._fireSound = game.globals.soundManager.add("chiptone/rapid-fire", 10);
    this._fireSound.playMultiple = true;
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
    this._reloadSound.playMultiple = true;
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const randomAngle = this.game.rnd.realInRange(-3, 3) * (Math.PI / 180);
      this._createProjectile(angle + randomAngle, 24, this._speed);
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
    const p = Projectile.makeSlug(this.game, x, y, this, player, this._damage, angle, speed);
    p.scale.setTo(0.6, 0.8);
  }
}
