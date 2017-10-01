import BaseWeapon from "./base-weapon";
import Projectile from "./base-projectile";
import WEAPON_TYPES from "./weapon-types";

export default class RapidFire extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.RAPID_FIRE, 40, 480, 1800);
    this._damage = 5;
    this._speed = 500;
  }

  fire(angle) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
      // Find trajectory
      const pelletNum = this.game.rnd.integerInRange(16, 24);

      // randomize the trajectory of every bulconst in the shotgun blast
      for (let i = 0; i < pelletNum; i++) {
        const mod = this.game.rnd.integerInRange(0, 30) * (Math.PI / 180) * this.game.rnd.sign();
        const rndAngle = angle + mod;
        const speed = this.game.rnd.integerInRange(350, 400);
        this._createProjectile(rndAngle, 24, speed);
      }

      this.incrementAmmo(-1);

      if (this.getAmmo() > 0) {
        this._startCooldown(this._cooldownTime);
      } else {
        this._reload();
      }
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
    p.scale.setTo(0.5, 0.5);
    const rgb = Phaser.Color.HSLtoRGB(0.75, 0.36, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
  }
}
