import BaseWeapon from "./base-weapon";
import Projectile from "./base-projectile";
import WEAPON_TYPES from "./weapon-types";

export default class RapidFire extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.RAPID_FIRE, 100, 25, 1800);
    this._damage = 10;
    this._speed = 500;
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const randomAngle = this.game.rnd.realInRange(-3, 3) * (Math.PI / 180);
      this._createProjectile(angle + randomAngle, 24, this._speed);
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) this._startCooldown(this._cooldownTime);
      else this._reload();
    }
  }

  _createProjectile(angle, playerDistance, speed) {
    const x = this._player.x + playerDistance * Math.cos(angle);
    const y = this._player.y + playerDistance * Math.sin(angle);
    const p = new Projectile(
      this.game,
      x,
      y,
      "assets",
      "weapons/slug",
      this,
      this._player,
      this._damage,
      angle,
      speed
    );
    p.scale.setTo(0.4, 0.4);
    const rgb = Phaser.Color.HSLtoRGB(0, 1, 0);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
  }
}
