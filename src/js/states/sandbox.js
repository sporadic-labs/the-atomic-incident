/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var ComboTracker = require("../helpers/combo-tracker.js");

function GameState() {}

GameState.prototype.create = function () {
    // Debugging FPS
    this.game.time.advancedTiming = true;
    
    // Initialize the world
    this.game.canvas.style.cursor = "none";
    this.game.canvas.addEventListener("contextmenu", function(e) {
        e.preventDefault();
    });
    this.stage.backgroundColor = "#F9F9F9";
    this.world.resize(2000, 2000);

    // Groups for z-index sorting and for collisions
    this.groups = {
        background: this.game.add.group(this.world, "background"),
        midground: this.game.add.group(this.world, "midground"),
        foreground: this.game.add.group(this.world, "foreground")
    };
    this.enemies = this.game.add.group(this.groups.midground, "enemies");
    this.pickups = this.game.add.group(this.groups.midground, "pickups");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    this.bg = this.add.tileSprite(0, 0, 2000, 2000, "assets", "hud/grid", 
        this.groups.background);

    this.reticule = new Reticule(this, this.groups.foreground);

    this.comboTracker = new ComboTracker(this.game, 2500);

    this.player = new Player(this.game, this.world.centerX, this.world.centerY,
        this.groups.foreground, this.enemies, this.pickups, this.reticule,
        this.comboTracker);
    this.camera.follow(this.player);
    
    // Score
    var scoreSignal = new Phaser.Signal();
    var scoreKeeper = new ScoreKeeper(scoreSignal);
    this.hud = new HeadsUpDisplay(this.game, this.groups.foreground,
        scoreKeeper, this.comboTracker);

    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(this.game, this.enemies, this.player, scoreSignal);
    
    // var FlockingGroup = require("../game-objects/enemies/flocking-group.js");
    // new FlockingGroup(this.game, 15, this.player.x, this.player.y + 200, 
    //     this.enemies, this.player, scoreSignal);
};

GameState.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
};