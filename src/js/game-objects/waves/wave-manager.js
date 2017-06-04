import WaveMeter from "./wave-meter";
import GenerateLevel from "../../levels/level-1";

class WaveManager {
    constructor(game) {
        this.game = game;

        this._timer = game.time.create(false);
        this._timer.start();

        this._waves = [];
        this._totalTime = 0;
        this._currentWaveIndex = 0;

        const waves = GenerateLevel(game);
        for (const wave of waves) {
            let totalWaveTime = 0;
            const startTime = this._totalTime + (wave.delay || 0);
            for (const enemyGroup of wave.enemyGroups) {
                if (enemyGroup.time > totalWaveTime) totalWaveTime = enemyGroup.time;
                const spawnTime = (startTime + enemyGroup.time) * 1000;
                this._timer.add(spawnTime, () => {
                    enemyGroup.wave.spawn(enemyGroup.composition);
                });
            }
            this._totalTime += startTime + totalWaveTime;
            this._waves.push({
                startTime,
                endTime: this._totalTime,
                enemyGroups: wave.enemyGroups,
                ammoDrops: wave.ammoDrops
            });
        }

        this._meter = new WaveMeter(game, this);

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