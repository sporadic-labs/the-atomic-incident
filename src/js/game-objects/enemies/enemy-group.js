import Enemy from "./enemy";
import DeathParticles from "./components/death-particles";

export default class EnemyGroup extends Phaser.Group {
  /**
   * Phaser Group for storing Enemy instances, and emitters for when enemies spawn and die.
   *
   * @param {Phaser.Game} game    - Phaser Game instance.
   * @param {Phaser.Group} parent - Global parent group.
   */
  constructor(game, parent = undefined) {
    super(game, parent, "EnemyGroup");

    this.deathParticles = new DeathParticles(game, this);

    this.onEnemyAdded = new Phaser.Signal();
    this.onEnemyKilled = new Phaser.Signal();
  }

  /**
   * Emit 'death' particles when an enemy is killed.
   *
   * @param {Phaser.Point} position - Position to emit the particles from.
   * @param {number} angle          - Angle in radians to emit the particles in.
   */
  emitDeathParticles(position, angle) {
    this.deathParticles.setEmitPosition(position.x, position.y);
    this.deathParticles.emitInWedge(10, angle, Math.PI * 0.5, 200, 200);
  }

  /**
   * Add an Enemy instance to this group.  Subscribe to the onDestroy signal
   * to remove the Enemy when it dies.
   *
   * @param {Enemy} enemy - New Enemy instance.
   */
  addEnemy(enemy) {
    this.add(enemy);
    this.onEnemyAdded.dispatch(enemy, this);
    enemy.events.onDestroy.addOnce(() => {
      this.remove(enemy);
      this.onEnemyKilled.dispatch(enemy, this);
    });
  }

  /**
   * Count the number of Enemy instances that are children of this group.
   */
  numberEnemiesAlive() {
    let numEnemiesAlive = 0;
    for (let i = 0; i < this.children.length; i++) {
      const child = this.children[i];
      if (child instanceof Enemy) {
        numEnemiesAlive++;
      }
    }
    return numEnemiesAlive;
  }

  /**
   * Clean up signals when this group is destroyed.
   *
   * @param {*} args
   */
  destroy(...args) {
    this.onEnemyAdded.dispose();
    this.onEnemyKilled.dispose();
    super.destroy(...args);
  }
}
