/**
 * A small class for managing and playing back sound effects. If a game object 
 * owns creates its own sound effects, it has to be responsible for destroying
 * them. That becomes a little problematic when the game object needs to play
 * a sound upon being destroyed. 
 * 
 * @class SoundEffectManager
 */
class SoundEffectManager {
    /**
     * Creates an instance of SoundEffectManager.
     * @param {Phaser.Game} game 
     * 
     * @memberOf SoundEffectManager
     */
    constructor(game) {
        this.game = game;
        this._soundsLoaded = {};
    }

    /**
     * Add a sound by its key if it hasn't already been loaded
     * 
     * @param {string} key 
     * @returns {Phaser.Sound} The sound that was loaded/retrieved from cache
     * 
     * @memberOf SoundEffectManager
     */
    add(key) {
        if (!this._soundsLoaded[key]) {
            this._soundsLoaded[key] = this.game.add.audio(key);
        }
        return this._soundsLoaded[key];
    }

    /**
     * Play the sound associated with the given key
     * 
     * @param {string} key 
     * @param {any} playArguments Any arguments after the key are passed through
     * to the play method. See Phaser.Sound#play.
     * @returns {Phaser.Sound} The sound that was played
     * 
     * @memberOf SoundEffectManager
     */
    play(key, ...playArguments) {
        if (this._soundsLoaded[key]) {
            this._soundsLoaded[key].play(...playArguments);
        } else {
            this.add(key);
            this._soundsLoaded[key].play(...playArguments)
        }
        return this._soundsLoaded[key];
    }

    /**
     * Destroys all the sounds that were loaded
     * 
     * @memberOf SoundEffectManager
     */
    destroy() {
        for (const sound of this._soundsLoaded) {
            sound.destroy();
        }
    }
}

module.exports = SoundEffectManager;