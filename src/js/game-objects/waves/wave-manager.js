import {CircleWave} from "./wave-shapes";
import WaveComposition from "./wave-composition";
import TargetingWave from "./targeting-wave";
import PathTweenWave from "./path-tween-wave";
import SnakePathWave from "./snake-path-wave";
import FlythroughWave from "./flythrough-wave";
import WaveMeter from "./wave-meter";

const colors = require("../../constants/colors");

class WaveManager {
    constructor(game) {
        this.game = game;
        const g = game;

        this._meter = new WaveMeter(game, this);

        this._timer = game.time.create(false);
        this._timer.start();

        this._waves = [];
        this._currentWaveIndex = 0;

        this._totalTime = 0;

        // Initial delay
        this._addPause(5);

        // Wave 1
        this._addWave([
            {
                waveTime: 0,
                color: colors.blue,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateBlue(g, 16), 80)
                )
            }, {
                waveTime: 3,
                color: colors.green,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateGreen(g, 16), 80)
                )
            }, {
                waveTime: 6,
                color: colors.red,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateRed(g, 16), 80)
                )
            },
        ]);

        // Rest
        this._addPause(15);

        // Wave 2
        this._addWave([
            {
                waveTime: 0,
                color: colors.red,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateRed(g, 16), 80)
                )
            },
            {
                waveTime: 3,
                color: colors.blue,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateBlue(g, 16), 80)
                )
            }, {
                waveTime: 4,
                color: colors.green,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateGreen(g, 16), 80)
                )
            }, {
                waveTime: 7,
                color: colors.blue,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateBlue(g, 16), 80)
                )
            }, {
                waveTime: 9,
                color: colors.red,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateRed(g, 16), 80)
                )
            }, {
                waveTime: 11,
                color: colors.green,
                wave: new TargetingWave(
                    g, new CircleWave(g, WaveComposition.CreateGreen(g, 16), 80)
                )
            },
        ]);

        // Rest
        this._addPause(15);

        // Wave 3
        this._addWave([
            {
                waveTime: 0,
                color: colors.red,
                wave: new PathTweenWave(
                    g, WaveComposition.CreateRed(g, 16), 75
                )
            }, {
                waveTime: 3,
                color: colors.green,
                wave: new SnakePathWave(
                    g, WaveComposition.CreateGreen(g, 16), 75
                )
            }, {
                waveTime: 5,
                color: colors.blue,
                wave: new PathTweenWave(
                    g, WaveComposition.CreateBlue(g, 16), 75
                )
            }
        ]);
    }

    /**
     * Adds a wave - a series of enemy groups with specific times when they should spawn
     *
     * @param {Object[]} enemyGroups Array of enemy groups in this wave
     * @param {number} enemyGroups[].waveTime The time in seconds relative to the start of this wave
     * @param {Wave} enemyGroups[].wave Instance of one of the wave classes
     * @param {Color} enemyGroups[].color The color of the wave
     *
     * @memberof WaveManager
     */
    _addWave(enemyGroups) {
        let totalWaveTime = 0;
        const startTime = this._totalTime;
        for (const enemyGroup of enemyGroups) {
            if (enemyGroup.waveTime > totalWaveTime) totalWaveTime = enemyGroup.waveTime;
            const spawnTime = (startTime + enemyGroup.waveTime) * 1000;
            this._timer.add(spawnTime, () => {
                enemyGroup.wave.spawn();
            });
        }
        this._totalTime += totalWaveTime;
        const wave = {
            waveNumber: this._waves.length,
            startTime,
            endTime: this._totalTime,
            groups: enemyGroups
        };
        this._waves.push(wave);
    }

    _addPause(pauseTime) {
        this._totalTime += pauseTime;
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