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
     * @param {number} radius The radius of the circle
     * 
     * @memberOf CircleWave
     */
    constructor(game, waveComposition, radius) {
        this.game = game;
        this.radius = radius;
        this._waveComposition = waveComposition;
    }

    /**
     * Generator that yields an object representing the enemy in the form
     * {type, position}
     * 
     * @memberOf CircleWave
     */
    *enemies() {
        this.position = this.game.globals.player.position.clone();
        this._waveComposition.generate();
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
            for (const enemy of wave.enemies()) {
                yield enemy;
            }
        }
    }
}

module.exports = {
    CircleWave,
    CombinedWave,
    LineWave
};