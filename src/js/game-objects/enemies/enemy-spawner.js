import Enemy from "./enemy";
import { shuffleArray, weightedPick } from "../../helpers/utilities";
import spawnBattalionWave from "./spawner/spawn-battalion-wave";
import Wave from "../waves/wave";

class IncrementableValue {
  constructor(min, max, increment) {
    this.min = min;
    this.max = max;
    this.increment = increment;
    this.value = this.min;
  }

  getValue() {
    return this.value;
  }

  incrementValue() {
    this.setValue(this.value + this.increment);
  }

  setValue(newValue) {
    if (newValue > this.max) newValue = this.max;
    if (newValue < this.min) newValue = this.min;
    this.value = newValue;
  }

  resetValue() {
    this.value = this.min;
  }
}

// Testing modification: add the type here & define how to spawn it in _spawnWavelet. The spawner
// will cycle through the types from last key through first when spawning.
const { ENEMY_TYPES } = require("../enemies/enemy-info");
const COMPOSITIONS = [
  {
    type: ENEMY_TYPES.FOLLOWING,
    number: new IncrementableValue(3, 10, 1),
    weight: 1,
    name: "Following Wave"
  },
  {
    type: ENEMY_TYPES.DASHING,
    number: new IncrementableValue(2, 5, 0.75),
    weight: 1,
    name: "Dashing Wave"
  },
  {
    type: ENEMY_TYPES.PROJECTILE,
    number: new IncrementableValue(1, 4, 0.75),
    weight: 1,
    name: "Projectile Wave"
  },
  {
    type: ENEMY_TYPES.DIVIDING,
    number: new IncrementableValue(1, 3, 0.5),
    weight: 1,
    name: "Dividing Wave"
  }
];
const incrementCompositions = () => COMPOSITIONS.forEach(elem => elem.number.incrementValue());
const resetCompositions = () => COMPOSITIONS.forEach(elem => elem.number.resetValue());

export default class EnemySpawner {
  /**
   * Factory for scheduling and creating enemy groups.
   *
   * @constructor
   * @param {Phaser.Game} game  - Phaser Game instance.
   * @param {Player} player     - Player instance.
   */
  constructor(game, player) {
    this.game = game;
    this._player = player;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;
    this._difficultyModifier = game.globals.difficultyModifier;

    this._numNormalWavelets = new IncrementableValue(1, 30, 1);
    this._numSpecialWavelets = new IncrementableValue(1, 10, 1);

    this._numWavesSpawned = 0;
    this._waveInterval = 5000;
    this._waveletInterval = 1750;
    this._remainingWavelets = 0;

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(500, this._scheduleNextWave, this);

    this.onWaveSpawn = new Phaser.Signal();

    // If the last enemy in a wave has been killed, schedule the next wave.
    this._enemies.onEnemyKilled.add(() => {
      if (this._remainingWavelets <= 0 && this._enemies.numberEnemiesAlive() === 0) {
        this._scheduleNextWave();
      }
    });

    resetCompositions();

    // this._spawnSound = this.game.globals.soundManager.add("chiptone/enemy-spawn");
  }

  _getDifficultyFraction() {
    return Phaser.Math.mapLinear(this._numWavesSpawned, 0, 20, 0, 1);
  }

  /**
   * Find a position for the next wavelet, choose the next enemy type,
   * spawn a wavelet, and schedule the next wavelet.
   *
   * @param {*} enemyOrder
   * @param {number} spawnDelay - Time delay between wavelets (in ms).
   */
  _spawnWavelet(enemyOrder, spawnDelay = 50) {
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

    // Decrease number of remaining wavelets.
    this._remainingWavelets--;
  }

  /**
   * Spawn an enemy
   *
   * @param {number} delay          - Time to wait before spawning the enemy (in ms).
   * @param {ENEMY_TYPES} enemyType - Enemy type to spawn.
   * @param {Phaser.Point} position - World location to spawn the enemy at.
   */
  spawnWithDelay(delay, enemyType, position) {
    this._timer.add(delay, () => {
      Enemy.SpawnWithIndicator(this.game, enemyType, position, this._enemies, 3000);
    });
  }

  /**
   *
   * @param {*} composition
   */
  _generateEnemyOrder(composition) {
    const enemies = [];
    for (const [typeName, numType] of Object.entries(composition.enemies)) {
      enemies.push(...Array(numType).fill(typeName));
    }
    shuffleArray(enemies);
    return enemies;
  }

  /**
   * Schedule the next wave
   */
  _scheduleNextWave() {
    this._numWavesSpawned++;
    this.onWaveSpawn.dispatch(this._numWavesSpawned);

    if (this._numWavesSpawned % 4 === 0) {
      // If the next wave difficulty is an multiple of 5, it is a special wave.
      this._timer.add(this._waveInterval, this._spawnSpecialWave, this);
    } else {
      // Otherwise, it is a normal wave.
      this._timer.add(this._waveInterval, this._spawnWave, this);
    }

    incrementCompositions();
    this._difficultyModifier.setDifficultyByFraction(this._getDifficultyFraction());
  }

  /**
   * Generate and spawn a wave of enemies, and increment the difficulty.
   */
  _spawnWave() {
    const numWavelets = Math.floor(this._numNormalWavelets.getValue());
    this._remainingWavelets = numWavelets;

    for (let i = 0; i < numWavelets; i++) {
      const comp = weightedPick(COMPOSITIONS);
      const num = Math.floor(comp.number.getValue());
      const enemies = Array(num).fill(comp.type);
      this._timer.add(this._waveletInterval * i, () => this._spawnWavelet(enemies));
    }

    this._numNormalWavelets.incrementValue();
  }

  /**
   * Generate and spawn a special 'boss' wave, and increment the difficulty.
   */
  _spawnSpecialWave() {
    const numWavelets = Math.floor(this._numSpecialWavelets.getValue());
    this._remainingWavelets = numWavelets;

    for (let i = 0; i < numWavelets; i++) {
      this._timer.add(this._waveletInterval * i, () => {
        spawnBattalionWave(this._player, this._mapManager, this._enemies);
        this._remainingWavelets--;
      });
    }

    this._numSpecialWavelets.incrementValue();
  }

  destroy() {
    this.onWaveSpawn.dispose();
  }
}
