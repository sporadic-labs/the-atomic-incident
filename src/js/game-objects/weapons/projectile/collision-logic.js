import Explosion from "../explosion";

/**
 * Base class for handling projectile collision with enemies and walls. The default logic is that a
 * projectile is destroyed on colliding with something. 
 * 
 * @class CollisionLogic
 */
export class CollisionLogic {
  constructor(projectile, damage) {
    this._projectile = projectile;
    this._damage = damage;
  }
  onCollideWithEnemy(enemy) {
    if (enemy._spawned) enemy.takeDamage(this._damage, this._projectile);
    this._projectile.destroy();
  }
  onCollideWithWall() {
    this._projectile._wallHitSound.play();
    this._projectile.destroy();
  }
}

/**
 * Piercing projectiles damage an enemy but are not destroyed on contact. 
 * 
 * @class PiercingCollisionLogic
 */
export class PiercingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
    this._enemiesDamaged = [];
  }

  onCollideWithEnemy(enemy) {
    if (enemy._spawned && !this._enemiesDamaged.includes(enemy)) {
      enemy.takeDamage(this._damage, this._projectile);
      this._enemiesDamaged.push(enemy);
    }
  }
}

/**
 * Exploding projectiles don't do damage themselves, but cause an explosion on contact with a wall
 * or enemy
 * 
 * @class ExplodingCollisionLogic
 */
export class ExplodingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
  }

  onCollideWithWall() {
    const p = this._projectile;
    if (!p.game) return; // Note: this check shouldn't be needed...
    new Explosion(p.game, p.x, p.y, p.parent, this._damage);
    p.destroy();
  }

  onCollideWithEnemy(enemy) {
    if (enemy._spawned) {
      const p = this._projectile;
      if (!p.game) return; // Note: this check shouldn't be needed...
      new Explosion(p.game, p.x, p.y, p.parent, this._damage);
      p.destroy();
    }
  }
}
