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

        // Groups for z-index sorting and for collision detection
        const groups = {
            game: game.add.group(this.world, "game"),
            hud: game.add.group(this.world, "hud")
        };
        groups.background = game.add.group(groups.game, "background");
        groups.midground = game.add.group(groups.game, "midground");
        groups.foreground = game.add.group(groups.game, "foreground");
        groups.enemies = game.add.group(groups.midground, "enemies"),
        groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding"),
        groups.pickups = game.add.group(groups.foreground, "pickups"),
        globals.groups = groups;

        const lm = new LevelManager(this.game, "arcade-map", "arcade-map-2");

        const img1 = this.game.add.image(0, 0, "assets", "hud/play");
        img1.scale.setTo(3, 3);
        const img2 = this.game.add.image(50, 0, "assets", "hud/play");
        img2.scale.setTo(3, 3);
    }

    update() {

    }
    
}

module.exports = TestState;