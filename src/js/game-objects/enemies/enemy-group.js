import DeathParticles from "./components/death-particles";
import EnemySpawnIndicator from "./enemy-spawn-indicator";

export default class EnemyGroup extends Phaser.Group {
  constructor(game, parent = undefined) {
    super(game, parent, "EnemyGroup");

    this.deathParticles = new DeathParticles(game, this);

    this.onEnemyAdded = new Phaser.Signal();
    this.onEnemyKilled = new Phaser.Signal();
  }

  emitDeathParticles(position, angle) {
    this.deathParticles.setEmitPosition(position.x, position.y);
    this.deathParticles.emitInWedge(10, angle, Math.PI * 0.5, 200, 200);
  }

  addEnemy(enemy) {
    this.onEnemyAdded.dispatch(enemy, this);
    enemy.events.onDestroy.addOnce(() => {
      this.onEnemyKilled.dispatch(enemy, this);
    });
    this.add(enemy);
  }

  destroy(...args) {
    this.onEnemyAdded.dispose();
    this.onEnemyKilled.dispose();
    super.destroy(...args);
  }
}
