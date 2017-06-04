import {CircleWave} from "./wave-shapes";
import WaveComp from "./wave-composition";
import TargetingWave from "./targeting-wave";
import PathTweenWave from "./path-tween-wave";
import SnakePathWave from "./snake-path-wave";
import FlythroughWave from "./flythrough-wave";
import WaveMeter from "./wave-meter";

const colors = require("../../constants/colors");

import GenerateLevel from "../../levels/level-1";

class WaveManager {
    constructor(game) {
        this.game = game;
        const g = game;

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