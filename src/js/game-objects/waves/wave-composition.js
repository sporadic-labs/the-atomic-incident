/**
 * Mainly a helper class for representing the types of enemies that can be in a
 * wave.
 * 
 * @class WaveComposition
 */
class WaveComposition {
    /**
     * Creates an instance of WaveComposition.
     * @param {number} fractionRed Fraction of enemies that should be red
     * @param {number} fractionGreen Fraction of enemies that should be green
     * @param {number} fractionBlue Fraction of enemies that should be blue
     * @param {boolean} shouldRandomize flag, should enemy order be shuffled?
     * @param {boolean} hasShield flag, do enemies have shield on spawn?
     * 
     * @memberOf WaveComposition
     */
    constructor(game, totalEnemies = 10, fractionRed = 1, fractionGreen = 0, 
            fractionBlue = 0, shouldRandomize = true, hasShield = false) {
        this.game = game;
        this._shouldRandomize = shouldRandomize;
        this._hasShield = hasShield;
        this.setTotalEnemies(totalEnemies);
        this.setComposition(fractionRed, fractionGreen, fractionBlue);
        this.generate();
    }

    static CreateRandOneType(game, totalEnemies = 10, hasShield = false) {
        return new WaveComposition(game, totalEnemies, 1, 0, 0, true, hasShield);
    }

    static CreateRandTwoTypes(game, totalEnemies = 10, hasShield = false) {
        return new WaveComposition(game, totalEnemies, 0.5, 0.5, 0, true, hasShield);
    }

    static CreateRandThreeTypes(game, totalEnemies = 10, hasShield = false) {
        return new WaveComposition(game, totalEnemies, 0.33, 0.33, 0.34, true, hasShield);
    }

    /**
     * Regenerate the enemies in a random order 
     * 
     * @memberOf WaveComposition
     */
    generate() {
        // Randomly shuffle enemy ratios if needed
        if (this._shouldRandomize) {
            const newRatio = Phaser.ArrayUtils.shuffle(
               [this._fractionRed, this._fractionGreen, this._fractionBlue] 
            );
            this.setComposition(...newRatio);
        }
        // Figure out how many of each type we need
        let r = Math.floor(this._fractionRed * this.totalEnemies);
        let g = Math.floor(this._fractionGreen * this.totalEnemies);
        let b = Math.floor(this._fractionBlue * this.totalEnemies);
        const remainder = this.totalEnemies - (r + g + b);
        for (let i = 0; i < remainder; i++) {
            // Note: should this be a weighted choice?
            const rand = this.game.rnd.integerInRange(0, 2);
            if (rand === 0) r++;
            else if (rand === 1) g++;
            else b++;
        }
        // Create an array of strings representing the enemies
        this._enemies = [];
        for (let i = 0; i < r; i++) this._enemies.push("red");
        for (let i = 0; i < g; i++) this._enemies.push("green");
        for (let i = 0; i < b; i++) this._enemies.push("blue");
        Phaser.ArrayUtils.shuffle(this._enemies);
        return this;
    }

    setTotalEnemies(totalEnemies) {
        this.totalEnemies = totalEnemies;
        return this;
    }

    setComposition(fractionRed = 1, fractionGreen = 0, fractionBlue = 0) {
        this._fractionRed = fractionRed;
        this._fractionGreen = fractionGreen;
        this._fractionBlue = fractionBlue;
        return this;
    }

    getEnemiesArray() {
        return this._enemies;
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

module.exports = WaveComposition;