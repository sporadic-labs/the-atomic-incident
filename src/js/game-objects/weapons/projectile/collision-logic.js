import Explosion from "../explosion";

/**
 * Base class for handling projectile collision with enemies and walls. The default logic is that a
 * projectile is destroyed on colliding with something. 
 * 
 * @class CollisionLogic
 */
export class CollisionLogic {
  constructor(projectile, damage) {
    this.projectile = projectile;
    this.damage = damage;
    this.wallHitSound = projectile.game.globals.soundManager.add("wall-hit", 3);
  }

  onCollideWithEnemy(enemy) {
    if (enemy._spawned) enemy.takeDamage(this.damage, this.projectile);
    this.projectile.destroy();
    return true; // Don't check against any other enemies within this frame
  }

  onCollideWithWall() {
    this.wallHitSound.play();
    this.projectile.destroy();
    return true; // Don't check against any other walls within this frame
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
      enemy.takeDamage(this.damage, this.projectile);
      this._enemiesDamaged.push(enemy);
    }
    return false; // Allow collision against multiple enemies within this frame
  }
}

/**
 * Exploding projectiles don't do damage themselves, but cause an explosion on contact with a wall
 * or enemy
 * 
 * @class ExplodingCollisionLogic
 */
export class ExplodingCollisionLogic extends CollisionLogic {
  onCollideWithWall() {
    const p = this.projectile;
    new Explosion(p.game, p.x, p.y, p.parent, this.damage);
    super.onCollideWithWall();
  }

  onCollideWithEnemy(enemy) {
    if (enemy._spawned) {
      const p = this.projectile;
      new Explosion(p.game, p.x, p.y, p.parent, this.damage);
      p.destroy();
      return true; // Don't check against any other enemies within this frame
    }
  }
}