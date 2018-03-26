import Explosion from "../explosion";

export const COLLISION_SURFACE = {
  DESTRUCTIBLE: "destructible",
  INDESTRUCTIBLE: "indestructible"
};

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

  /** Noop on base class, but can be used in derived classes */
  onBeforeCollisions() {}
  onAfterCollisions() {}

  // Destroy no matter what
  onCollideWithEnemy(enemy) {
    enemy.attemptHit(this.projectile, this.damage);
    this.projectile.destroy();
  }

  // Destroy no matter what
  onCollideWithWall() {
    this.wallHitSound.play();
    this.projectile.destroy();
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
    if (!this._enemiesDamaged.includes(enemy)) {
      const surfaceHit = enemy.attemptHit(this.projectile, this.damage);
      if (surfaceHit === COLLISION_SURFACE.DESTRUCTIBLE) this._enemiesDamaged.push(enemy);
      else if (surfaceHit === COLLISION_SURFACE.INDESTRUCTIBLE) this.projectile.destroy();
    }
  }
}

/**
 * Bouncing projectiles damage an enemy but are not destroyed on contact.
 *
 * @class BouncingCollisionLogic
 */
export class BouncingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
  }

  // Noop
  onCollideWithWall() {}
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
    this.hasExploded = false; // Used to prevent exploding on wall AND enemy in same update tick
  }

  onCollideWithWall() {
    if (this.hasExploded) return true;
    const p = this.projectile;
    new Explosion(p.game, p.x, p.y, p.parent, this.damage);
    super.onCollideWithWall();
    this.hasExploded = true;
  }

  onCollideWithEnemy(enemy) {
    if (this.hasExploded) return true;
    const p = this.projectile;
    new Explosion(p.game, p.x, p.y, p.parent, this.damage);
    p.destroy();
    this.hasExploded = true;
  }
}
