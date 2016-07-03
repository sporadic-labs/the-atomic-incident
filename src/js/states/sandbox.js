/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");

function GameState() {}

GameState.prototype.create = function () {
    // Create the space for globals on the game object
    this.game.globals = {};

    // Shorthands
    var game = this.game;
    var globals = game.globals;
    
    // Debugging FPS
    game.time.advancedTiming = true;
    
    // Canvas styling
    game.canvas.style.cursor = "none";
    game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });

    // Groups for z-index sorting and for collisions
    var groups = {
        background: game.add.group(this.world, "background"),
        midground: game.add.group(this.world, "midground"),
        foreground: game.add.group(this.world, "foreground")
    };
    groups.enemies = game.add.group(groups.midground, "enemies");
    groups.pickups = game.add.group(groups.midground, "pickups");
    groups.nonCollidingGroup = game.add.group(groups.midground, 
        "non-colliding");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";
    this.world.resize(1300, 1300);
    this.add.tileSprite(0, 0, this.world.width, this.world.height, "assets", 
        "hud/grid", groups.background);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    var player = new Player(game, this.world.centerX, this.world.centerY, 
        groups.midground);
    this.camera.follow(player);
    globals.player = player;
    
    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    var Wave1 = require("../game-objects/waves/wave-1.js");
    new Wave1(this.game, this.enemies, this.nonCollidingGroup, this.player, 
        scoreSignal);
    
    // var FlockingGroup = require("../game-objects/enemies/flocking-group.js");
    // new FlockingGroup(this.game, 15, this.player.x, this.player.y + 200, 
    //     this.enemies, this.player, scoreSignal);

    // var WallGroup = require("../game-objects/enemies/wall-group.js");
    // new WallGroup(this.game, 15, this.enemies, this.player, scoreSignal);
    
    // var SineGroup = require("../game-objects/enemies/sine-wave-group.js");
    // new SineGroup(this.game, 45, this.enemies, this.player, scoreSignal);

    // var SpawnerGroup = require("../game-objects/enemies/spawner-group.js");
    // new SpawnerGroup(this.game, 4, this.enemies, this.player, scoreSignal);

};

GameState.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
};