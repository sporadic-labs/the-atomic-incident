/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/enemies/seeker-enemy.js");
var Wander = require("../game-objects/enemies/wander-enemy.js");
var ScorePickup = require("../game-objects/pickups/score-pickup.js");
var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
var Reticule = require("../game-objects/reticule.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var ComboTracker = require("../helpers/combo-tracker.js");

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

    // Random enemies
    for (var i = 0; i < 300; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Seeker(this.game, pos.x, pos.y, this.enemies, this.player, 
            scoreSignal);
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
    // score
    for (var i = 0; i < 24; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new ScorePickup(this.game, pos.x, pos.y, this.pickups, "diamond",
            scoreSignal);
    }
    // weapons
    for (var i = 0; i < 36; i += 1) {
        var pos;
        var newType;
        var t = this.game.rnd.integerInRange(0, 4);
        if (t === 1 || t === 3) {
            newType = "gun";
        } else if (t === 2 || t === 4) {
            newType = "laser";
        } else {
            newType = "sword";
        }
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new WeaponPickup(this.game, pos.x, pos.y, this.pickups, newType,
            scoreSignal);
    }

};

GameState.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
};