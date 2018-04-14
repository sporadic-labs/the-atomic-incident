import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class BouncingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.BOUNCING, 24, 300, 1000);
    this._damage = 25;
    this._speed = 320;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("chiptone/piercing-fire");
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      this._createProjectile(angle, 24, speed);
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
    Projectile.makeBouncing(this.game, x, y, this, player, this._damage, angle, speed);
  }
}
