import BaseWeapon from "./base-weapon";
import Projectile from "./projectile/";
import WEAPON_TYPES from "./weapon-types";

export default class Flamethrower extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.FLAMETHROWER, 96, 24, 2800);
    this._damage = 14;
    this._speed = 320;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = game.globals.soundManager.add("missile");
    this._reloadSound = game.globals.soundManager.add("chiptone/reload");
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

    // Randomize the angle/speed of each flame.
    angle += this.game.rnd.integerInRange(0, 45) * (Math.PI / 180) * this.game.rnd.sign();
    speed += this.game.rnd.integerInRange(0, 36) * this.game.rnd.sign();

    // Randomize the max age of each flame.
    const maxAge = this.game.rnd.integerInRange(520, 640);

    // Randomize the color of each flame.
    const r = this.game.rnd.integerInRange(0, 255);
    const color = Phaser.Color.getColor(r, 255, 255);

    Projectile.makeFlame(this.game, x, y, this, player, this._damage, angle, speed, maxAge, color);
  }
}
