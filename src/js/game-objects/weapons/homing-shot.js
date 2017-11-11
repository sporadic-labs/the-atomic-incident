import BaseWeapon from "./base-weapon";
import Projectile from "./projectile";
import WEAPON_TYPES from "./weapon-types";

export default class HomingShot extends BaseWeapon {
  constructor(game, parentGroup, player, enemies) {
    super(game, parentGroup, player, enemies, WEAPON_TYPES.HOMING_SHOT, 35, 200, 1500);
    this._damage = 50;
    this._speed = 150;
  }

  fire(angle) {
    if (this.isAbleToAttack()) {
      const closestEnemy = this._getClosestEnemy();
      const p = this._createProjectile(angle, 24, this._speed);
      p._target = closestEnemy;
      this.incrementAmmo(-1);
      if (this.getAmmo() > 0) this._startCooldown(this._cooldownTime);
      else this._reload();
    }
  }

  update() {
    const maxRotation = 2 * Math.PI * this.game.time.physicsElapsed; // 360 deg/s
    const offset = Math.PI / 2; // Graphic is 90 degrees rotated from what Phaser expects
    for (const projectile of this.children) {
      // Skip projectiles without a target or with a destroyed target
      if (!projectile._target || !projectile._target.game) continue;
      // Update rotation to point towards target
      const targetRotation = projectile.position.angle(projectile._target.position) + offset;
      const angleDelta = this.game.math.wrapAngle(targetRotation - projectile.rotation, true);
      const rotation = Math.min(Math.abs(angleDelta), maxRotation);
      if (angleDelta > 0) projectile.rotation += rotation;
      else projectile.rotation -= rotation;
      // Update velocity to match heading
      projectile.body.velocity.x = Math.cos(projectile.rotation - offset) * this._speed;
      projectile.body.velocity.y = Math.sin(projectile.rotation - offset) * this._speed;
    }
    super.update();
  }

  _getClosestEnemy() {
    let closestEnemy = null;
    let closestDistance = Number.MAX_VALUE;
    const r = this._player._playerLight.getRadius();
    for (const enemy of this._enemies.children) {
      const d = this._player.position.distance(enemy.position);
      if (d <= r && d < closestDistance) {
        closestDistance = d;
        closestEnemy = enemy;
      }
    }
    return closestEnemy;
  }

  _createProjectile(angle, playerDistance, speed) {
    const player = this._player;
    const x = player.x + playerDistance * Math.cos(angle);
    const y = player.y + playerDistance * Math.sin(angle);
    const p = Projectile.makeHomingShot(this.game, x, y, this, player, this._damage, angle, speed);
    p.scale.setTo(1.2, 1.2);
    return p;
  }
}
