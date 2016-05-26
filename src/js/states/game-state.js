/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/enemies/seeker-enemy.js");
var Wander = require("../game-objects/enemies/wander-enemy.js");
var Pickup = require("../game-objects/pickups/base-pickup.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");

function GameState() {}

GameState.prototype.create = function () {
    // Initialize the world
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

    this.bg = this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid", 
        this.groups.background);

    this.reticule = new Reticule(this, this.groups.foreground);

    this.player = new Player(this.game, this.world.centerX, this.world.centerY,
        this.groups.foreground, this.enemies, this.pickups, this.reticule);
    this.camera.follow(this.player);
    
    // Score
    var scoreSignal = new Phaser.Signal();
    var scoreKeeper = new ScoreKeeper(scoreSignal);
    var hud = new HeadsUpDisplay(this.game, this.groups.foreground, 
        scoreKeeper);

    // Random enemies
    for (var i = 0; i < 300; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Seeker(this.game, pos.x, pos.y, this.enemies,
            this.player, scoreSignal);
    }

    for (var i = 0; i < 48; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Wander(this.game, pos.x, pos.y, this.enemies, this.player,
            scoreSignal);
    }

    // Random pickups
    for (var i = 0; i < 32; i += 1) {
        var pos;
        var newType;
        var t = this.game.rnd.integerInRange(0,1);
        t === 1 ? newType = "gun" : newType = "laser";
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Pickup(this.game, pos.x, pos.y, this.pickups, newType);
    }

};