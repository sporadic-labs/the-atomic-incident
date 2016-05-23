/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/seeker-enemy.js");
var Reticule = require("../game-objects/reticule.js");

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

    this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid", 
        this.groups.background);

    this.reticule = new Reticule(this, this.groups.foreground);

    this.player = new Player(this.game, this.world.centerX, this.world.centerY,
        this.groups.foreground, this.enemies, this.reticule);
    this.camera.follow(this.player);
    
    // Random enemies
    for (var i = 0; i < 300; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Seeker(this.game, pos.x, pos.y, this.enemies, this.player);
    }
};