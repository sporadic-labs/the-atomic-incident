import { EnemyIndicator, GoalIndicator } from "./radar-indicator";

/**
 * Player Radar. Keep track of enemy position.  Display an arrow pointing in their general
 * direction, relative to the player light. If the enemy is in light, no need for the arrow.  Use
 * your eyes!
 *
 * @class Radar
 */
export default class Radar extends Phaser.Group {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game, parent, player, enemyGroup, pickupSpawner) {
    super(game, parent, "radar");

    this._player = player;

    this._weaponIndicator = null;
    pickupSpawner.onPickupSpawned.add(pickup => {
      this._weaponIndicator = new GoalIndicator(game, this, player, pickup);
    });
    pickupSpawner.onPickupCollected.add(() => {
      if (this._weaponIndicator) {
        this._weaponIndicator.destroy();
        this._weaponIndicator = null;
      }
    });

    this._enemyIndicators = [];
    enemyGroup.onEnemyAdded.add(enemy => {
      const indicator = new EnemyIndicator(this.game, this, player, enemy);
      this._enemyIndicators.push(indicator);
    });
    enemyGroup.onEnemyKilled.add(enemy => {
      this._enemyIndicators = this._enemyIndicators.filter(indicator => {
        if (indicator.getTarget() === enemy) {
          indicator.destroy();
          return false;
        }
        return true;
      });
    });
  }

  update() {
    if (this._weaponIndicator) this._weaponIndicator.updatePlacement(20);
    for (const enemyIndicator of this._enemyIndicators) {
      enemyIndicator.updatePlacement(5);
    }
    super.update();
  }
}
