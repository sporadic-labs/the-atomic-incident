/**
 * @file A set of classes for controlling the spawn points of a wave.
 */

/**
 * A class for generating enemies evenly spaced around the player.
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
     * Generator that yields an object representing the enemy in the form:
     * {type: string name of color from WaveComposition, position}
     *
     * @param {boolean} [regenerateEnemies=true] Whether or not to generate a
     * new set of enemies from the WaveComposition.
     *
     * @memberOf CircleWave
     */
    *enemies(regenerateEnemies = true) {
        // Spawn in front of the player
        const player = this.game.globals.player;
        const v = player.getVelocity();
        this.position = player.position.clone().add(
            v.x * 0.25,
            v.y * 0.25
        );

        if (regenerateEnemies) this._waveComposition.generate();
        let enemyNum = 0;
        const angleStep = 2 * Math.PI / this._waveComposition.totalEnemies;
        for (const enemy of this._waveComposition.enemies()) {
            const angle = angleStep * enemyNum;
            const position = this.position.clone().add(
                Math.cos(angle) * this.radius,
                Math.sin(angle) * this.radius
            );
            enemyNum++;
            yield {type: enemy, position, shield: this._waveComposition._hasShield};
        }
    }
}

/**
 * A class for generating enemies in a line offset from the player by some
 * distance. The tangent of the line always points towards the player. This wave
 * isn't terribly useful on its own, but it can be used to form more complex
 * patterns, e.g. see tunnel class.
 *
 * @class LineWave
 */
class LineWave {
    /**
     * Creates an instance of LineWave.
     * @param {Phaser.Game} game
     * @param {WaveComposition} waveComposition The types of enemies to use
     * for generation
     * @param {number} playerOffset The distance of the line from the player
     * @param {number} length The length of the line
     * @param {number} angle Orientation in degrees (counter-clockwise)
     *
     * @memberOf LineWave
     */
    constructor(game, waveComposition, playerOffset, length, angle) {
        this.game = game;
        this.length = length;
        this.playerOffset = playerOffset;
        this.length = length;
        this.angle = angle * Math.PI / 180;
        this._waveComposition = waveComposition;
    }

    /**
     * Generator that yields an object representing the enemy in the form:
     * {type: string name of color from WaveComposition, position}
     *
     * @param {boolean} [regenerateEnemies=true] Whether or not to generate a
     * new set of enemies from the WaveComposition.
     *
     * @memberOf LineWave
     */
    *enemies(regenerateEnemies = true) {
        // Find position of the center of the line. Start at the player and move
        // in the direction of the line's tangent.
        const pos = this.game.globals.player.position.clone().add(
            Math.cos(this.angle + Math.PI / 2) * this.playerOffset,
            Math.sin(this.angle + Math.PI / 2) * this.playerOffset
        );
        // Generate a fresh batch of enemies
        if (regenerateEnemies) this._waveComposition.generate();
        // Figure out the enemy positions, starting at one end of the line
        let enemyNum = 0;
        const lengthStep = this.length /
            (this._waveComposition.totalEnemies - 1);
        const startPosition = pos.clone().subtract(
            (this.length / 2) * Math.cos(this.angle),
            (this.length / 2) * Math.sin(this.angle)
        );
        for (const enemy of this._waveComposition.enemies()) {
            const position = startPosition.clone().add(
                (lengthStep * enemyNum) * Math.cos(this.angle),
                (lengthStep * enemyNum) * Math.sin(this.angle)
            );
            enemyNum++;
            yield {type: enemy, position, shield: this._waveComposition._hasShield};
        }
    }
}

/**
 * A class for generating enemies in a tunnel formation - two walls on either
 * side of the player. Each wall has its own composition of enemies.
 *
 * @class TunnelWave
 */
class TunnelWave {
    /**
     * Creates an instance of TunnelWave.
     * @param {Phaser.Game} game
     * @param {WaveComposition} wall1Composition Composition of first wall
     * @param {WaveComposition} wall2Composition Composition of second wall
     * @param {number} width Width of the opening of the tunnel
     * @param {number} length Depth of the tunnel
     * @param {number} angle Orientation in degrees (counter-clockwise)
     *
     * @memberOf TunnelWave
     */
    constructor(game, wall1Composition, wall2Composition, width, length,angle) {
        this._wall1Composition = wall1Composition;
        this._wall2Composition = wall2Composition;
        this._line1 = new LineWave(game, wall1Composition, -(width / 2), length, angle),
        this._line2 = new LineWave(game, wall2Composition, width / 2, length, angle);
    }

    /**
     * Generator that yields an object representing the enemy in the form:
     * {type: string name of color from WaveComposition, position}
     *
     * @param {boolean} [regenerateEnemies=true] Whether or not to generate a
     * new set of enemies from the WaveComposition.
     *
     * @memberOf TunnelWave
     */
    *enemies(regenerateEnemies = true) {
        // Allow the TunnelWave to be in charge of generating enemies from the
        // WaveComposition instances
        if (regenerateEnemies) {
            this._wall1Composition.generate();
            this._wall2Composition.generate();
        }
        yield* this._line1.enemies(false);
        yield* this._line2.enemies(false);
    }
}

/**
 * A class for generating enemies in an X formation centered on the player. Each
 * line of the X has its own composition of enemies.
 *
 * @class CrossWave
 */
class CrossWave {
    /**
     * Creates an instance of CrossWave.
     * @param {Phaser.Game} game
     * @param {WaveComposition} line1Composition First line's composition
     * @param {WaveComposition} wall2Composition Second line's composition
     * @param {number} length Length of the lines forming the X
     *
     * @memberOf CrossWave
     */
    constructor(game, line1Composition, line2Composition, length) {
        this._line1Composition = line1Composition;
        this._line2Composition = line2Composition;
        this._line1 = new LineWave(game, line1Composition, 0, length,
            Math.PI/4);
        this._line2 = new LineWave(game, line2Composition, 0, length,
            -Math.PI/4);
    }

    /**
     * Generator that yields an object representing the enemy in the form:
     * {type: string name of color from WaveComposition, position}
     *
     * @param {boolean} [regenerateEnemies=true] Whether or not to generate a
     * new set of enemies from the WaveComposition.
     *
     * @memberOf CrossWave
     */
    *enemies(regenerateEnemies = true) {
        // Allow the CrossWave to be in charge of generating enemies from the
        // WaveComposition instances
        if (regenerateEnemies) {
            this._line1Composition.generate();
            this._line2Composition.generate();
        }
        yield* this._line1.enemies(false);
        yield* this._line2.enemies(false);
    }
}

export {CircleWave, LineWave, TunnelWave, CrossWave};