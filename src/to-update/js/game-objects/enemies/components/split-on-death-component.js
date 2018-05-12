import Enemy from "../enemy";
import { ENEMY_TYPES } from "../enemy-info";

export default class SplitOnDeathComponent {
  constructor(parent, targetingComponent) {
    this.game = parent.game;
    this.parent = parent;
    this.projectileGroup = this.game.add.group(this.game.globals.groups.midground);
    this._targetingComponent = targetingComponent;
  }

  update() {
    // Nothing special to update.
  }

  splitOnDeath() {
    this._targetingComponent.isActive = false;

    const num = this.game.rnd.integerInRange(2, 3);
    for (let i = 0; i < num; i++) {
      const mod = 16 * i * this.game.rnd.sign();
      const position = new Phaser.Point(this.parent.position.x + mod, this.parent.position.y + mod);
      Enemy.MakeEnemyType(this.game, ENEMY_TYPES.DIVIDING_SMALL, position, this.parent.enemyGroup);
    }
  }

  destroy() {
    // Nothing special to destroy.
  }
}
