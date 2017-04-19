var utils = require("../../helpers/utilities.js");

/**
 * Mainly a helper class for representing the types of enemies that can be in a
 * wave.
 * 
 * @class WaveComposition
 */
class WaveComposition {
    /**
     * Creates an instance of WaveComposition.
     * @param {number} redNum Number of enemies
     * @param {number} greenNum Number of enemies
     * @param {number} blueNum Number of enemies
     * 
     * @memberOf WaveComposition
     */
    constructor(redNum, greenNum, blueNum) {
        this.redNum = redNum || 0;
        this.greenNum = greenNum || 0;
        this.blueNum = blueNum || 0;
        this.totalEnemies = this.redNum + this.greenNum + this.blueNum;
        this._enemies = [];

        this.resetWave();
    }

    /**
     * Regenerate the enemies in a random order 
     * 
     * @memberOf WaveComposition
     */
    resetWave() {
        this._enemies = [];
        var i;
        for (i = 0; i < this.redNum; i++) this._enemies.push("red");
        for (i = 0; i < this.greenNum; i++) this._enemies.push("green");
        for (i = 0; i < this.blueNum; i++) this._enemies.push("blue");
        utils.shuffleArray(this._enemies);
    }

    /**
     * Generator that yields the enemy types in the current wave
     * 
     * @memberOf WaveComposition
     */
    *enemies() {
        for (const enemy of this._enemies) {
            yield enemy;
        }
    }
}

/**
 * A class for generating enemies evenly spaced around a center point.
 * 
 * @class CircleWave
 */
class CircleWave {
    /**
     * Creates an instance of CircleWave.
     * @param {Phaser.Game} game 
     * @param {WaveComposition} waveComposition The types of enemies to use 
     * for generation
     * @param {Phaser.Point} position The center of the circle
     * @param {number} radius The radius of the circle
     * 
     * @memberOf CircleWave
     */
    constructor(game, waveComposition, position, radius) {
        this.game = game;
        this.radius = radius;
        this.position = position;
        this._waveComposition = waveComposition;
    }

    /**
     * Generator that yields an object representing the enemy in the form
     * {type, position}
     * 
     * @memberOf CircleWave
     */
    *enemies() {
        this._waveComposition.resetWave();
        let enemyNum = 0;
        const angleStep = 2 * Math.PI / this._waveComposition.totalEnemies;
        for (const enemy of this._waveComposition.enemies()) {
            const angle = angleStep * enemyNum;
            const position = this.position.clone().add(
                Math.cos(angle) * this.radius,
                Math.sin(angle) * this.radius
            );
            enemyNum++;
            yield {type: enemy, position};
        }
    }
}

/**
 * A class for generating enemies in a line
 * 
 * @class LineWave
 */
class LineWave {
    /**
     * Creates an instance of LineWave.
     * @param {Phaser.Game} game 
     * @param {WaveComposition} waveComposition The types of enemies to use 
     * for generation
     * @param {Phaser.Point} position The center of the line
     * @param {number} length The length of the line
     * @param {number} angle The orientation of the line in radians 
     * (counter-clockwise) 
     * 
     * @memberOf LineWave
     */
    constructor(game, waveComposition, position, length, angle) {
        this.game = game;
        this.length = length;
        this.position = position;
        this.length = length;
        this.angle = angle;
        this._waveComposition = waveComposition;
    }

    /**
     * Generator that yields an object representing the enemy in the form
     * {type, position}
     * 
     * @memberOf CircleWave
     */
    *enemies() {
        this._waveComposition.resetWave();
        let enemyNum = 0;
        const lengthStep = this.length / this._waveComposition.totalEnemies;
        const cosAngle = Math.cos(this.angle);
        const sinAngle = Math.sin(this.angle);
        const startPosition = this.position.clone().subtract(
            (this.length / 2) * cosAngle,
            (this.length / 2) * sinAngle
        );
        for (const enemy of this._waveComposition.enemies()) {
            const position = startPosition.clone().add(
                (lengthStep * enemyNum) * cosAngle,
                (lengthStep * enemyNum) * sinAngle
            );
            enemyNum++;
            yield {type: enemy, position};
        }
    }
}

/**
 * A class for combining waves into a single object that can be iterated over 
 * (e.g. combining two lines to form a cross)
 * 
 * @class CombinedWave
 */
class CombinedWave {
    /**
     * Creates an instance of CombinedWave.
     * @param {...Wave} waves Any number of Wave instances 
     * 
     * @memberOf CombinedWave
     */
    constructor(...waves) {
        this._waves = waves;
    }

    *enemies() {
        for (const wave of this._waves) {
            debugger;
            for (const enemy of wave.enemies()) {
                yield enemy;
            }
        }
    }
}

module.exports = {
    WaveComposition,
    CircleWave,
    CombinedWave,
    LineWave
};