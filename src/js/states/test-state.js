const LevelManager = require("../game-objects/level-manager.js");

class TestState {
    
    /**
     * Creates an instance of TestState. Called by Phaser when the state is 
     * registered with the game.
     * 
     * @param {Phaser.Game} game 
     * 
     * @memberOf TestState
     */
    constructor(game) {
        this.game = game;
    }

    create() {
        const game = this.game;
        const globals = game.globals;

        const groups = {
            background: game.add.group(this.world, "background"),
            midground: game.add.group(this.world, "midground"),
            foreground: game.add.group(this.world, "foreground")
        };
        globals.groups = groups;

        const lm = new LevelManager(this.game, "tilemap", "tilemap-2");

            
        var map1 = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
        map1.onDown.add(() => lm.switchMap(0));
        var map2 = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
        map2.onDown.add(() => lm.switchMap(1));
    }
}

module.exports = TestState;