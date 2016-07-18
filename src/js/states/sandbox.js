/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");

function Sandbox() {}

Sandbox.prototype.create = function () {
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

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin)
    };

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

    // Tile map for level creation and pathfinding
    // Creates a blank tilemap
    var map = game.add.tilemap();
    // Add an image to the map
    map.addTilesetImage("tiles", "tiles", 36, 36, null, null, 0);
    map.setCollision(0);
    // Create a new layer
    var layer1 = map.create('level1', 30, 20, 36, 36);
    layer1.resizeWorld();

    // Fill whole level with colliding tiles
    for (var i = 0; i < map.width; i += 1) {
        for (var j = 0; j < map.height; j += 1) {
            map.putTile(0, i, j, layer1);
        }
    }
    // Remove collinding tiles via drunken walk
    var drunkWalk = function (x, y, steps) {
        map.putTile(null, x, y, layer1);
        for (var i = 0; i < steps; i += 1) {
            if (this.rnd.integerInRange(0, 1)) {
                x += this.rnd.sign();
                x = Math.max(x, 0);
                x = Math.min(x, map.width - 1);
            } else {            
                y += this.rnd.sign();
                y = Math.max(y, 0);
                y = Math.min(y, map.width - 1);
            }
            map.putTile(null, x, y, layer1);
        }        
    }.bind(this);
    var x = Math.floor(map.width / 2);
    var y = Math.floor(map.height / 2);
    drunkWalk(x, y, 100);
    drunkWalk(x, y, 200);
    drunkWalk(x, y, 300);

    this.game.globals.tileMap = map;
    this.game.globals.tileMapLayer = layer1;

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
    new Wave1(game);

    // var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
    // for (var i=0; i<50; i++) {
    //     new WeaponPickup(this.game, this.game.rnd.integerInRange(0, 1300), 
    //         this.game.rnd.integerInRange(0, 1300), "gun", 5)
    // }
    
    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
        } else {
            globals.plugins.satBody.enableDebugAll();
        }
    }, this);
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
};
