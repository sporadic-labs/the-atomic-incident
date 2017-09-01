export default class Level {
  constructor(game, levelName) {
    this.game = game;
    this.name = levelName;
    this.waves = [];
    this.totalTime = 0;

    this.waveStartedSignal = new Phaser.Signal();

    this._timer = game.time.create(false);
  }

  start() {
    // Set up signal events for the start of each wave events
    for (const [i, wave] of this.waves.entries()) {
      this._timer.add(wave.startTime * 1000, () => {
        this.waveStartedSignal.dispatch(i, wave);
      });
    }
    this._timer.start();
  }

  getSeconds() {
    return this._timer.seconds;
  }

  /**
     * @param {object} param Wave parameters
     * @param {string} [param.mapName=null] Name of the map to load for the wave
     * @param {number} [param.lightRadius=350] Size of the player's light for the wave
     * @param {object[]} [param.ammoDrops=[]] Array describing when ammo pickups should drop
     * @param {object[]} [param.enemyGroups=[]] Array describing when groups of enemies should spawn
     * @memberof WaveData
     */
  addWave({ mapName = null, lightRadius = 350, ammoDrops = [], enemyGroups = [] }) {
    // Start time of the wave
    const startTime = this.totalTime;
    // Total duration of the wave (e.g. time of the last enemy/drop to spawn)
    let duration = 0;
    for (const group of enemyGroups) duration = Math.max(duration, group.time);
    for (const drop of ammoDrops) duration = Math.max(duration, drop.time);
    // End time of the wave (factors in the delay)
    const endTime = startTime + duration;

    // Add the wave
    this.waves.push({
      startTime,
      endTime,
      enemyGroups,
      ammoDrops,
      mapName,
      lightRadius
    });

    // Update the level's total time
    this.totalTime = endTime;

    return this;
  }

  addWaveDelay(delay) {
    this.totalTime += delay;
    return this;
  }

  destroy() {
    this._timer.destroy();
  }
}
