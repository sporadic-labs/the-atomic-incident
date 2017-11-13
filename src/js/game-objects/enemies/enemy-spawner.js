import Enemy from "./enemy";
import { shuffleArray } from "../../helpers/utilities";

// Testing modification: add the type here & define how to spawn it in _spawnWavelet. The spawner
// will cycle through the types from last key through first when spawning.
const { ENEMY_TYPES } = require("../enemies/enemy-info");
const COMPOSITIONS = [
  {
    [ENEMY_TYPES.GREEN_CELL]: 1,
    [ENEMY_TYPES.TEAL_CELL]: 1,
    [ENEMY_TYPES.TURTLE]: 3,
    name: "test"
  }
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

      if (!this._mapManager.isLocationInNavMesh(pos.x, pos.y)) continue;

      switch (enemyType) {
        case ENEMY_TYPES.GREEN_CELL:
          Enemy.MakeEnemyType(this.game, enemyType, pos, this._enemies);
          break;
        case ENEMY_TYPES.TURTLE:
          Enemy.MakeEnemyType(this.game, enemyType, pos, this._enemies);
          break;
        case ENEMY_TYPES.TEAL_CELL:
          Enemy.MakeEnemyType(this.game, enemyType, pos, this._enemies);
          break;
        default:
          break;
      }

      // if (enemyType === ENEMY_TYPES.SMALL) Enemy.MakeEnemyType(this.game, pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.BIG) Enemy.MakeBig(this.game, pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.GREEN_CELL)
      //   Enemy.MakeEnemyType(this.game, "enemies/green-cell", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.PURPLE_CELL)
      //   Enemy.MakeEnemyType(this.game, "enemies/purple-cell", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.TEAL_CELL)
      //   Enemy.MakeEnemyType(this.game, "enemies/teal-cell", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.AMOEBA)
      //   Enemy.MakeEnemyType(this.game, "enemies/amoeba_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.BACTERIA)
      //   Enemy.MakeEnemyType(this.game, "enemies/bacteria_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.BEETLE)
      //   Enemy.MakeEnemyType(this.game, "enemies/beetle_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.GORILLA)
      //   Enemy.MakeEnemyType(this.game, "enemies/gorilla_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.SNAIL)
      //   Enemy.MakeEnemyType(this.game, "enemies/snail_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.TURTLE)
      //   Enemy.MakeEnemyType(this.game, "enemies/turtle_50", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.VIRUS)
      //   Enemy.MakeEnemyType(this.game, "enemies/virus", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.VIRUS_DARK)
      //   Enemy.MakeEnemyType(this.game, "enemies/virus-dark", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.PARTICLE)
      //   Enemy.MakeEnemyType(this.game, "enemies/particle-creature", pos, this._enemies);
      // else if (enemyType === ENEMY_TYPES.PARTICLE_DARK)
      //   Enemy.MakeEnemyType(this.game, "enemies/particle-creature-dark", pos, this._enemies);
    }
  }

  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const [typeName, numType] of Object.entries(composition)) {
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  _spawnTesterWave() {
    if (!this._testerTypePool) this._testerTypePool = Object.keys(ENEMY_TYPES);

    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) {
      const order = [];
      for (let j = 0; j < 5; j++) {
        if (this._testerTypePool.length === 0) this._testerTypePool = Object.keys(ENEMY_TYPES);
        const type = this._testerTypePool.pop();
        order.push(type);
      }
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(order));
    }

    const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
    this._timer.add(nextWaveDelay, this._spawnTesterWave, this);
    this._waveDifficulty += 1 / 3;
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
