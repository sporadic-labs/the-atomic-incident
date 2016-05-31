/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
// var Seeker = require("../game-objects/enemies/seeker-enemy.js");
// var Wander = require("../game-objects/enemies/wander-enemy.js");
var Dash = require("../game-objects/enemies/dash-enemy.js");
var SpiralGroup = require("../game-objects/enemies/spiral-group.js");
var ScorePickup = require("../game-objects/pickups/score-pickup.js");
// var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var ComboTracker = require("../helpers/combo-tracker.js");

function GameState() {}

GameState.prototype.create = function () {
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


    // Random enemies
    new Dash(this.game, 800, 800, this.enemies, this.player,
        scoreSignal);

    new SpiralGroup(this.game, 20, this.world.centerX, this.world.centerY,
        this.enemies, this.player, scoreSignal);

    // Random pickups
    // score
    for (var i = 0; i < 24; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new ScorePickup(this.game, pos.x, pos.y, this.pickups, "diamond",
            scoreSignal);
    }

};