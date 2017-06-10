import WaveMeter from "./wave-meter";
import GenerateLevel from "../../levels/level-1";
import WaveMenu from "./wave-menu";

const colors = require("../../constants/colors");

class WaveManager {
    /**
     * Creates an instance of WaveManager.
     * @param {Phaser.Game} game 
     * @param {PickupSpawner} pickupSpawner 
     * 
     * @memberof WaveManager
     */
    constructor(game, pickupSpawner) {
        this.game = game;
        this._pickupSpawner = pickupSpawner;
        const g = game;

        // Meter for indicating which waves are coming.
        this._meter = new WaveMeter(game, this);
        // Menu to show wave/ammo compisition at the beginning of a wave.
        this._menu = new WaveMenu(game, this);

        this._timer = game.time.create(false);
        this._timer.start();

        this._waves = [];
        this._totalTime = 0;
        this._currentWaveIndex = 0;

        const waves = GenerateLevel(game);
        for (const [i, wave] of waves.entries()) {
            let totalWaveTime = 0;
            const startTime = this._totalTime;
            for (const enemyGroup of wave.enemyGroups) {
                if (enemyGroup.time > totalWaveTime) totalWaveTime = enemyGroup.time;
                // const spawnTime = (startTime + enemyGroup.time) * 1000;
                // this._timer.add(spawnTime, () => {
                //     enemyGroup.wave.spawn(enemyGroup.composition);
                // });
            }
            this._totalTime += startTime + wave.delay + totalWaveTime;
            this._waves.push({
                startTime,
                endTime: this._totalTime,
                delay: wave.delay,
                enemyGroups: wave.enemyGroups,
                ammoDrops: wave.ammoDrops
            });
            this._timer.add(startTime * 1000, this.onWaveStart.bind(this, i));
        }

        this._meter = new WaveMeter(game, this);

    }

    onWaveStart(waveIndex) {
        this._currentWaveIndex = waveIndex;
        const wave = this._waves[waveIndex];

        // Spawn the enemies
        for (const enemyGroup of wave.enemyGroups) {
            // Enemies get a delay, but ammo does not
            const relativeMs = (wave.delay + enemyGroup.time) * 1000;
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
        this._pickupSpawner.spawnPickup
    }

    getSeconds() {
        return this._timer.seconds;
    }

    getWaves() {
        return this._waves;
    }

    destroy() {
        this._timer.destroy();
    }
}

export default WaveManager;