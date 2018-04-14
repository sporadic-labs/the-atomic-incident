import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class Flamethrower extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.FLAMETHROWER, 124, 24, 2800);
    this._damage = 14;
    this._speed = 320;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("fire-whoosh-2", 64, 0.85);
  }

  fire(angle) {
    if (this.isAbleToAttack() && this.getAmmo() > 0) {
      const speed = this._difficultyModifier.getSpeedMultiplier() * this._speed;
      this._createProjectile(angle, 24, speed);
      this.incrementAmmo(-1);
      this._fireSound.play();
      this._startCooldown(this._cooldownTime);
    }
  }

  /**
   * Create a flame sprite with customized properties.
   *
   * @param {number} angle
   * @param {number} playerDistance
   * @param {number} speed
   */
  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);

    // Randomize the properties of each flame.
    angle += this.game.rnd.integerInRange(0, 45) * (Math.PI / 180) * this.game.rnd.sign();
    speed += this.game.rnd.integerInRange(0, 36) * this.game.rnd.sign();
    const maxAge = this.game.rnd.integerInRange(520, 640);
    const r = this.game.rnd.integerInRange(200, 255);
    const color = Phaser.Color.getColor(r, r, r);

    // Create the projectile.
    const { game, _damage } = this;
    const p = Projectile.makeFlame(game, x, y, this, player, _damage, angle, speed, maxAge, color);
    if (p.body) {
      p.body.angularVelocity = this.game.rnd.sign() * this.game.rnd.integerInRange(5, 8);

      // Sprite body won't follow this scaling yet, so make the change in scale small.
      this.game.make
        .tween(p.scale)
        .to({ x: 0.75, y: 0.75 }, maxAge, Phaser.Easing.Elastic.InOut, true);
    }
  }
}
