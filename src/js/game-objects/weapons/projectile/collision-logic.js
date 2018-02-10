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

  /** Noop on base class, but can be used in derived classes */
  onBeforeCollisions() {}
  onAfterCollisions() {}

  onCollideWithEnemy(enemy) {
    enemy.attemptHit(this.projectile, this.damage);
    this.projectile.destroy();
  }

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
      const hitEnemy = enemy.attemptHit(this.projectile, this.damage);
      if (hitEnemy) this._enemiesDamaged.push(enemy);
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
    this._enemiesHit = [];
    this._enemiesOverlapping = [];
  }

  onBeforeCollisions() {
    this._enemiesOverlapping = [];
  }

  onCollideWithEnemy(enemy) {
    if (!this._enemiesOverlapping.includes(enemy)) this._enemiesOverlapping.push(enemy);
  }

  onAfterCollisions() {
    // Attempt to hit any newly overlapping enemies that weren't already hit
    for (const enemy of this._enemiesOverlapping) {
      if (!this._enemiesHit.includes(enemy)) {
        const hitEnemy = enemy.attemptHit(this.projectile, this.damage);
        if (hitEnemy) this._enemiesHit.push(enemy);
      }
    }

    // If the projectile has left an overlapping enemy, time to reset it so that it can be hit again
    for (let i = this._enemiesHit.length - 1; i >= 0; i--) {
      const enemy = this._enemiesHit[i];
      if (!this._enemiesOverlapping.includes(enemy)) {
        this._enemiesHit.splice(i, 1);
      }
    }
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
