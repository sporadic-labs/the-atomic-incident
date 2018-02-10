import Enemy from "./enemy";
import { shuffleArray, weightedPick } from "../../helpers/utilities";

// Testing modification: add the type here & define how to spawn it in _spawnWavelet. The spawner
// will cycle through the types from last key through first when spawning.
const { ENEMY_TYPES } = require("../enemies/enemy-info");
const COMPOSITIONS = [
  // {
  //   enemies: { [ENEMY_TYPES.BACTERIA]: 3 },
  //   weight: 1,
  //   name: "Bacteria Wave"
  // },
  // {
  //   enemies: { [ENEMY_TYPES.WORM]: 3 },
  //   weight: 2,
  //   name: "Worm Wave"
  // },
  // {
  //   enemies: { [ENEMY_TYPES.BEETLE]: 3 },
  //   weight: 1,
  //   name: "Beetle Wave"
  // },
  // {
  //   enemies: { [ENEMY_TYPES.VIRUS]: 2 },
  //   weight: 2,
  //   name: "Virus Wave"
  // },
  {
    enemies: { [ENEMY_TYPES.PARTICLE_TANK]: 3 },
    weight: 1,
    name: "Particle Tank Wave"
  }
  // {
  //   enemies: { [ENEMY_TYPES.AMOEBA]: 1 },
  //   weight: 1,
  //   name: "Amoeba Wave"
  // }
];

export default class EnemySpawner {
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;

    this._waveDifficulty = 1;
    this._waveDifficultyIncrement = 1 / 3;
    this._waveInterval = 5000;
    this._waveletInterval = 750;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(500, this._spawnWave, this);

    // this._spawnSound = this.game.globals.soundManager.add("chiptone/enemy-spawn");

    // Use the 'L' button to force a wavelet to spawn.
    game.input.keyboard.addKey(Phaser.Keyboard.L).onDown.add(() => this._spawnWave(false));
  }

  _spawnWavelet(enemyOrder, spawnDelay = 250) {
    // Determine the wave positioning
    const radius = this._player.getLightRadius() - 25;

    // Attempt to place in the direction the player is moving
    let spawnAngle = this._player.getVelocity().isZero()
      ? this.game.rnd.realInRange(0, 2 * Math.PI)
      : new Phaser.Point(0, 0).angle(this._player.getVelocity());
    let spawnPosition = this._player.position
      .clone()
      .add(radius * Math.cos(spawnAngle), radius * Math.sin(spawnAngle));

    // Fallback: pick a random angle
    let attempts = 0;
    while (!this._mapManager.isLocationInNavMesh(spawnPosition.x, spawnPosition.y)) {
      spawnAngle = this.game.rnd.realInRange(0, 2 * Math.PI);
      spawnPosition = this._player.position
        .clone()
        .add(radius * Math.cos(spawnAngle), radius * Math.sin(spawnAngle));
      attempts++;
    }
    if (attempts >= 25) {
      console.warn("No valid spawn point found");
      return;
    }

    // Play the enemy spawn sound.
    // this._spawnSound.play();

    // Spawn in cluster around spawn point
    const spawnRadius = 50;
    for (const [i, enemyType] of enemyOrder.entries()) {
      let enemyPosition;
      let attempts = 0;

      // Attempt to find a spawn point nearby the cluster center point
      do {
        const angle = this.game.rnd.realInRange(0, 2 * Math.PI);
        enemyPosition = spawnPosition
          .clone()
          .add(spawnRadius * Math.cos(angle), spawnRadius * Math.sin(angle));
        attempts++;
      } while (
        !this._mapManager.isLocationInNavMesh(enemyPosition.x, enemyPosition.y) &&
        attempts < 25
      );

      if (attempts >= 25) {
        console.warn("Unable to place enemy near spawn point");
        continue;
      }

      if (enemyType in ENEMY_TYPES) {
        this.spawnWithDelay(i * spawnDelay, enemyType, enemyPosition);
      } else {
        console.warn(`Unknown enemy type: ${enemyType}`);
      }
    }
  }

  spawnWithDelay(delay, enemyType, position) {
    this._timer.add(delay, () =>
      Enemy.SpawnWithIndicator(this.game, enemyType, position, this._enemies, 3000)
    );
  }

  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const [typeName, numType] of Object.entries(composition.enemies)) {
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  _scheduleTesterWavelet(numEnemies, time) {
    if (!this._testerTypePool) this._testerTypePool = Object.keys(ENEMY_TYPES);
    const order = [];
    for (let j = 0; j < numEnemies; j++) {
      if (this._testerTypePool.length === 0) this._testerTypePool = Object.keys(ENEMY_TYPES);
      const type = this._testerTypePool.pop();
      order.push(type);
    }
    this._timer.add(time, () => this._spawnWavelet(order));
  }

  _spawnTesterWave() {
    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) this._scheduleTesterWavelet(5, this._waveletInterval * i);

    const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
    this._timer.add(nextWaveDelay, this._spawnTesterWave, this);
    this._waveDifficulty += this._waveDifficultyIncrement;
  }

  _spawnWave(scheduleNext = true) {
    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) {
      const comp = weightedPick(COMPOSITIONS);
      const order = this._generateEnemyOrder(comp);
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(order));
    }

    this._waveDifficulty += this._waveDifficultyIncrement;

    if (scheduleNext) {
      const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
      if (this._waveDifficulty % 2 === 0) {
        // If the next wave difficulty is an multiple of 5, it is a special wave.
        this._timer.add(nextWaveDelay, this._spawnSpecialWave, this);
      } else {
        // Otherwise, it is a normal wave.
        this._timer.add(nextWaveDelay, this._spawnWave, this);
      }
    }
  }

  _spawnSpecialWave(scheduleNext = true) {
    console.log("a very special wave!");
    const numWavelets = Math.floor(this._waveDifficulty);

    for (let i = 0; i < numWavelets; i++) {
      const comp = weightedPick(COMPOSITIONS);
      const order = this._generateEnemyOrder(comp);
      this._timer.add(this._waveletInterval * i / 4, () => this._spawnWavelet(order));
    }

    this._waveDifficulty += this._waveDifficultyIncrement;

    if (scheduleNext) {
      const nextWaveDelay = this._waveletInterval * numWavelets + this._waveInterval;
      this._timer.add(nextWaveDelay, this._spawnWave, this);
    }
  }
}
