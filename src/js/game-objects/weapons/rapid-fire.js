import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class RapidFire extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.RAPID_FIRE, 100, 75, 1800);
    this._damage = 12;
    this._speed = 500;

    this._fireSound = game.globals.soundManager.add("fx/rapid-shot-2", null, 0.3);

    this._difficultyModifier = this.game.globals.difficultyModifier;
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      const randomAngle = this.game.rnd.realInRange(-3, 3) * (Math.PI / 180);
      this._createProjectile(angle + randomAngle, 24, speed);
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) {
        this._fireSound.play();
        this._startCooldown(this._cooldownTime);
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
