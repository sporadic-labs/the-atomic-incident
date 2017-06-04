let abilityId = 0;

class Ability {
    constructor(game, player) {
        this.game = game;
        this._player = player;
        this._id = abilityId++;
    }

    update() {
        // Child class should override this
    }

    activate() {
        // Child class should override this
    }

    deactivate() {
        // Child class should override this
    }

    destroy() {
        // Child class should override this
        this.game = null;
        this._player = null;
    }
}

module.exports = Ability;