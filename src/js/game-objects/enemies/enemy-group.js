export default class EnemyGroup extends Phaser.Group {
  constructor(game, parent = undefined) {
    super(game, parent, "EnemyGroup");

    this.onEnemyAdded = new Phaser.Signal();
    this.onEnemyKilled = new Phaser.Signal();
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
