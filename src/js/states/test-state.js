const SoundEffectManager = require("../game-objects/sound-effect-manager.js");
const EffectsPlugin = 
    require("../plugins/camera-effects-plugin/camera-effects-plugin.js");
const LevelManager = require("../game-objects/level-manager.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");

import PhaserNavmesh from "phaser-navmesh/src/library";

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
        // Shorthands
        const game = this.game;
        const globals = game.globals;

        // Debugging FPS
        game.time.advancedTiming = true;
        
        // Canvas styling
        game.canvas.style.cursor = "none";
        game.canvas.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        });

        // Groups for z-index sorting and for collisions
        const groups = {
            game: game.add.group(this.world, "game"),
            gameOverlay: game.add.group(this.world, "game-overlay"),
            hud: game.add.group(this.world, "hud")
        };
        groups.background = game.add.group(groups.game, "background");
        groups.midground = game.add.group(groups.game, "midground");
        groups.foreground = game.add.group(groups.game, "foreground");
        groups.enemies = game.add.group(groups.midground, "enemies"),
        groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding"),
        groups.pickups = game.add.group(groups.foreground, "pickups"),
        globals.groups = groups;

        // Initializing the world
        this.stage.backgroundColor = "#FFF";

        // Plugins
        global.plugins = (global.plugins !== undefined) ? global.plugins : {}; 
        globals.plugins.satBody = game.plugins.add(SatBodyPlugin); 
        globals.plugins.effects = game.plugins.add(EffectsPlugin); 
        globals.plugins.navMesh = game.plugins.add(PhaserNavmesh);
        globals.plugins.satBody = game.plugins.add(SatBodyPlugin);

        // Level manager
        const levelManager = new LevelManager(game, ...globals.tilemapNames);
        globals.levelManager = levelManager;

        // Lighting plugin - needs to be set up after level manager
        globals.plugins.lighting = game.plugins.add(LightingPlugin, groups.foreground); 
        this.lighting = globals.plugins.lighting;
        this.lighting.setOpacity(0.1);
        
        // Sound manager
        globals.soundManager = new SoundEffectManager(this.game);

        // Physics
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.set(0);

        // Player
        // Setup a new player, and attach it to the global variabls object.
        var player = new Player(game, game.width/2, game.height/2, groups.foreground);
        this.camera.follow(player);
        globals.player = player;
    }
}

module.exports = TestState;