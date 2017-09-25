import BaseWeapon from "./base-weapon";
import Projectile from "./base-projectile";

export default class Scattershot extends BaseWeapon {
  constructor(game, parentGroup, player) {
    super(game, parentGroup, "Scattershot", player);

    // Initial weapon settings:
    //  Ammo               - 24 shots / clip
    //  Time between shots - 400 ms
    //  Reload time        - 1800 ms
    this.init(24, 480, 1800);
  }

  fire(angle) {
    if (this.isAbleToAttack() && !this.isAmmoEmpty()) {
      // Find trajectory
      const pelletNum = this.game.rnd.integerInRange(16, 24);

      // randomize the trajectory of every bulconst in the shotgun blast
      for (let i = 0; i < pelletNum; i++) {
        const mod = this.game.rnd.integerInRange(0, 30) * (Math.PI / 180) * this.game.rnd.sign();
        const rndAngle = angle + mod;
        const speed = this.game.rnd.integerInRange(364, 376);
        const perpendicularOffset = this.game.rnd.integerInRange(-5, 5);
        this._createProjectile(rndAngle, 24, perpendicularOffset, speed);
      }

      this.incrementAmmo(-1);

      if (this.getAmmo() > 0) {
        this._startCooldown(this._cooldownTime);
      } else {
        this._reload();
      }
    }
  }

  _createProjectile(angle, playerDistance, perpendicularOffset, speed) {
    const perpAngle = angle - Math.PI / 2;
    const x =
      this._player.x + playerDistance * Math.cos(angle) - perpendicularOffset * Math.cos(perpAngle);
    const y =
      this._player.y + playerDistance * Math.sin(angle) - perpendicularOffset * Math.sin(perpAngle);
    // shotgun blast is made up of a bunch of slugs at half size.
    const p = new Projectile(
      this.game,
      x,
      y,
      "assets",
      "weapons/slug",
      this,
      this._player,
      10,
      angle,
      speed
    );
    p.scale.setTo(0.5, 0.5);
    const rgb = Phaser.Color.HSLtoRGB(0.75, 0.36, 0.64);
    p.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
  }
}
