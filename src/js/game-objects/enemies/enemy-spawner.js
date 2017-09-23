import Enemy from "./enemy";
import Composition from "../waves/wave-composition";
import { CircleWave } from "../waves/wave-shapes";

export default class EnemySpawner {
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;

    // this._circleWaveTimer = this.game.time.create(false);
    // this._circleWaveTimer.start();
    // this._circleWaveTimer.add(1000, () => this._spawnCircleWave());

    this._ambientEnemyTimer = this.game.time.create(false);
    this._ambientEnemyTimer.start();
    this._ambientEnemyTimer.add(0, () => this._spawnRandomEnemy());
  }

  _spawnCircleWave() {
    const shape = new CircleWave(this.game, 120);
    const composition = new Composition({ red: 10 });
    for (const enemyInfo of shape.enemies(composition)) {
      const pos = enemyInfo.position;
      if (!this._mapManager.isLocationEmpty(pos.x, pos.y)) continue;
      Enemy.MakeSmall(this.game, pos, this._enemies);
    }
    this._circleWaveTimer.add(this.game.rnd.integerInRange(7000, 12000), () =>
      this._spawnCircleWave()
    );
  }

  _spawnRandomEnemy() {
    let x, y;
    do {
      x = this.game.rnd.realInRange(0, this.game.width);
      y = this.game.rnd.realInRange(0, this.game.width);
    } while (!this._mapManager.isLocationEmpty(x, y));
    if (this.game.rnd.sign() > 0) Enemy.MakeSmall(this.game, { x, y }, this._enemies);
    else Enemy.MakeBig(this.game, { x, y }, this._enemies);
    this._ambientEnemyTimer.add(this.game.rnd.integerInRange(500, 1000), () =>
      this._spawnRandomEnemy()
    );
  }
}
