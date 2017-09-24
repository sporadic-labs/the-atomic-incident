import Enemy from "./enemy";
import { shuffleArray } from "../../helpers/utilities";

const ENEMY_TYPES = { SMALL: "SMALL", BIG: "BIG" };
const COMPOSITIONS = [
  { [ENEMY_TYPES.SMALL]: 4, [ENEMY_TYPES.BIG]: 0, name: "all small" },
  { [ENEMY_TYPES.SMALL]: 2, [ENEMY_TYPES.BIG]: 1, name: "big + small" }
];

export default class EnemySpawner {
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;

    this._waveDifficulty = 1;
    this._waveInterval = 5000;
    this._waveletInterval = 750;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(500, this._spawnWave, this);
  }

  _spawnWavelet(enemyOrder, angleSpan = Math.PI / 5) {
    // Determine the wave positioning
    const radius = this._player.getLightRadius() - 25;
    const spawnAngle = this._player.getVelocity().isZero()
      ? this.game.rnd.realInRange(0, 2 * Math.PI)
      : new Phaser.Point(0, 0).angle(this._player.getVelocity());

    // Spawn in an arc
    const step = angleSpan / enemyOrder.length;
    const startAngle = spawnAngle - angleSpan / 2;
    for (const [i, enemyType] of enemyOrder.entries()) {
      const enemyAngle = startAngle + step * i;
      const pos = this._player.position
        .clone()
        .add(radius * Math.cos(enemyAngle), radius * Math.sin(enemyAngle));
      if (!this._mapManager.isLocationEmpty(pos.x, pos.y)) continue;
      if (enemyType === ENEMY_TYPES.SMALL) Enemy.MakeSmall(this.game, pos, this._enemies);
      else if (enemyType === ENEMY_TYPES.BIG) Enemy.MakeBig(this.game, pos, this._enemies);
    }
  }

  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const typeName of Object.values(ENEMY_TYPES)) {
      const numType = composition[typeName];
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  _spawnWave() {
    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) {
      const comp = this.game.rnd.pick(COMPOSITIONS);
      const order = this._generateEnemyOrder(comp);
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(order));
    }

    const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
    this._timer.add(nextWaveDelay, this._spawnWave, this);
    this._waveDifficulty += 1 / 3;
  }
}
