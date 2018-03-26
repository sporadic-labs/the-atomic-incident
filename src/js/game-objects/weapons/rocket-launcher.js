import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class RocketLauncher extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.ROCKET_LAUNCHER, 8, 1000, 3000);
    this._damage = 200;
    this._speed = 320;

    this._fireSound = game.globals.soundManager.add("missile");
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");

    this._difficultyModifier = this.game.globals.difficultyModifier;
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      this._createProjectile(angle, 24, speed);
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) {
        this._fireSound.play();
        this._startCooldown(this._cooldownTime);
      } else {
        this._reloadSound.play();
        // this._reload();
      }
    }
  }

  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    Projectile.makeRocket(this.game, x, y, this, player, this._damage, angle, speed);
  }
}
