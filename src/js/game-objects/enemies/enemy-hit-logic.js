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
    this._weakSpotBody = enemy.game.globals.plugins.satBody.addPolygonBody(enemy, mappedPoints);
  }

  /**
   * Returns whether or not the projectile successfully hit the enemy
   */
  attemptHit(projectile) {
    if (!this._weakSpotBody.testOverlap(projectile.satBody)) return false;
    else return true;
  }
}
