/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/seeker-enemy.js");
var Wander = require("../game-objects/wander-enemy.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");

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

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    this.bg = this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid", 
        this.groups.background);

    this.reticule = new Reticule(this, this.groups.foreground);

    this.player = new Player(this.game, this.world.centerX, this.world.centerY,
        this.groups.foreground, this.enemies, this.reticule);
    this.camera.follow(this.player);
    
    // Signal
    this._signal = new Phaser.Signal();

    // Random enemies
    for (var i = 0; i < 300; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Seeker(this.game, pos.x, pos.y, this.enemies,
            this.player, this._signal);
    }

    // one wandering enemy
    new Wander(this.game, 800, 800, this.enemies, this.player,
        this._signal);

    // Score
    this.scoreKeeper = new ScoreKeeper(this, this.groups.foreground,
        this._signal);
    this.scoreText = this.add.text(400, 500,
        "Score: 0", { 
            font: "32px Arial", 
            fill: "#000", 
            align: "center" 
        });
    this.scoreText.fixedToCamera = true;
    this.scoreText.cameraOffset.setTo(36, 24);
    this.groups.foreground.add(this.scoreText);
};

GameState.prototype.update = function () {
    this.scoreText.text = "Score: " + this.scoreKeeper.score;
};