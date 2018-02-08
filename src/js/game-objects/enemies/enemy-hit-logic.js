/**
 * Base class for handling the logic for enemies getting hit by an attack. This allows us to have
 * special logic for projectiles against different enemy types. The default logic is that a
 * projectile hits an enemy and does damage.
 *
 * @class EnemyHitLogic
 */
export class EnemyHitLogic {
  constructor(enemy) {
    this.enemy = enemy;
  }

  /** Noop in base class, but can be used by derived classes */
  update() {}

  /**
   * Returns whether or not the projectile successfully hit the enemy
   */
  attemptHit(projectile) {
    return true;
  }
}

export class WeakSpotHitLogic {
  constructor(enemy) {
    this.enemy = enemy;

    // Hard coded to match tank for now
    const weakPoints = [[21, 66], [15, 55], [58, 55], [53, 66], [37, 72]];
    const mappedPoints = weakPoints.map(p => ({ x: p[0] - 75 / 2, y: p[1] - 75 / 2 }));
    this.weakSpot = enemy.game.physics.sat.add.staticBody().setPolygon(mappedPoints);

    this.enemy.events.onDestroy.add(() => this.weakSpot.destroy());
  }

  update() {
    this.weakSpot.copyPosition(this.enemy.body.position);
    this.weakSpot.setRotation(this.enemy.body.rotation);
  }

  /**
   * Returns whether or not the projectile successfully hit the enemy
   */
  attemptHit(projectile) {
    if (!this.enemy.game.physics.sat.world.overlap(this.weakSpot, projectile)) return false;
    else return true;
  }
}
