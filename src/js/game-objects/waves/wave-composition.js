const colors = require("../../constants/colors");

/**
 * Mainly a helper class for representing the types of enemies that can be in a
 * wave.
 *
 * @class WaveComposition
 */
class WaveComposition {
    /**
     * Creates an instance of WaveComposition.
     * @param {Object} options The parameters for the wave's composition
     * @param {number} [options.red = 0] The number of red enemies
     * @param {number} [options.green = 0] The number of green enemies
     * @param {number} [options.blue = 0] The number of green enemies
     * @param {boolean} [options.randomize = false] Whether or not to shuffle the enemy types
     * @param {Color|null} [options.shield = null] The color of the shield
     * 
     * @memberof WaveComposition
     */
    constructor({red = 0, green = 0, blue = 0, randomize = false, shield = null} = {}) {
        this._composition = {red, green, blue};
        this._randomize = randomize;
        this._shield = shield;
        this.generate();
    }
    
    /**
     * Rescales the composition so that there are exactly enough enemies to match the newTotal.
     * 
     * @param {number} newTotal 
     * @returns {this} For chaining
     * 
     * @memberof WaveComposition
     */
    setTotal(newTotal) {
        const total = this.getTotal();
        let {red, green, blue} = this._composition;
        red = Math.floor((red / total) * newTotal); 
        green = Math.floor((green / total) * newTotal); 
        blue = Math.floor((blue / total) * newTotal);
        let remainder = newTotal - (red + green + blue);
        while (remainder > 0) {
            remainder--;
            const r = Math.random();
            if (r <= 1 / 3) red++;
            else if (r <= 2 / 3) green++;
            else blue++;
        }
        this._composition = {red, green, blue};
        return this;
    }

    /**
     * Get the total number of enemies in the wave
     * 
     * @returns {number}
     * 
     * @memberof WaveComposition
     */
    getTotal() {
        return this._composition.red + this._composition.green + this._composition.blue;
    }
    
    /**
     * Get the color of the shield, or null if there is no shield
     * 
     * @returns {Color|null}
     * 
     * @memberof WaveComposition
     */
    getShield() {
        return this._shield;
    }

    /**
     * Get the color of this wave (assumes that the wave can only contain a single type)
     * 
     * @returns {Color}
     * 
     * @memberof WaveComposition
     */
    getColor() {
        if (this._composition.red) return colors.red;
        else if (this._composition.blue) return colors.blue;
        else return colors.green;
    }

    /**
     * Regenerate the enemies in a random order
     *
     * @memberOf WaveComposition
     */
    generate() {
        // Randomly shuffle enemy ratios if needed
        if (this._randomize) {
            const newRatio = Phaser.ArrayUtils.shuffle(
               [this._composition.red, this._composition.green, this._composition.blue]
            );
            this._composition.red = newRatio[0];
            this._composition.green = newRatio[1];
            this._composition.blue = newRatio[2];
        }
        // Create an array of strings representing the enemies
        this._enemies = [];
        for (let i = 0; i < this._composition.red; i++) this._enemies.push("red");
        for (let i = 0; i < this._composition.green; i++) this._enemies.push("green");
        for (let i = 0; i < this._composition.blue; i++) this._enemies.push("blue");
        Phaser.ArrayUtils.shuffle(this._enemies);
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

export default WaveComposition;