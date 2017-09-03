import WaveMeter from "./wave-meter";
import WaveMenu from "./wave-menu";

class WaveManager {
  /**
     * Creates an instance of WaveManager.
     * @param {Phaser.Game} game 
     * @param {PickupSpawner} pickupSpawner 
     * @param {Level} level The level with wave data 
     * 
     * @memberof WaveManager
     */
  constructor(game, pickupSpawner, level) {
    this.game = game;
    this._pickupSpawner = pickupSpawner;
    this._level = level;

    // Meter for indicating which waves are coming.
    this._meter = new WaveMeter(game, this, level);

    this._timer = game.time.create(false);
    this._timer.start();

    this._waves = [];
    this._totalTime = 0;
    this._currentWaveIndex = 0;
    this._currentWaveNumber = 0;

    // Subscribe to wave start events
    level.waveStartedSignal.add(this._onWaveStart, this);
  }

  _onWaveStart(waveIndex, wave) {
    // Spawn the enemies
    for (const enemyGroup of wave.enemyGroups) {
      // Enemies get a delay, but ammo does not
      const relativeMs = enemyGroup.time * 1000;
      this._timer.add(relativeMs, () => {
        enemyGroup.wave.spawn(enemyGroup.composition);
      });
    }

    // Spawn the ammo pickups
    for (const ammoDrop of wave.ammoDrops) {
      // No delay for ammo
      const relativeMs = ammoDrop.time * 1000;
      this._timer.add(relativeMs, () => {
        for (const [color, amount] of Object.entries(ammoDrop.ammo)) {
          this._pickupSpawner.spawnPickup(color, amount);
        }
      });
    }

    this._currentWaveNumber++;
    // Create a new wave menu.  This will handle showing/hiding itself.
    new WaveMenu(this.game, this, wave);
  }

  // Returns the Current Wave number, used in the Wave Menu.
  getWaveNumber() {
    return this._currentWaveNumber;
  }

  destroy() {
    this._timer.destroy();
  }
}

export default WaveManager;
