/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var AStar = require("../plugins/AStar.js");
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
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar)
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

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("colors", "coloredTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("Background", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var blockingLayer = map.createLayer("BlockingLayer", this.game.width, 
        this.game.height, groups.background);
    map.setCollisionBetween(0, 3, true, "BlockingLayer");

    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "BlockingLayer", "colors");

    globals.tileMap = map;
    globals.tileMapLayer = blockingLayer;

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    var px = 0;
    var py = 0;
    if (map.objects["Objects"]) {
        var objects = map.objects["Objects"];
        for (var i = 0; i < objects.length; i++) {
            if (objects[i].name === "player") {
                px = objects[i].x;
                py = objects[i].y;
            }
        }
    }
    var player = new Player(game, px, py, groups.midground);
    this.camera.follow(player);
    globals.player = player;
    
    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    var SeekerEnemy = require("../game-objects/enemies/seeker-enemy.js");
    new SeekerEnemy(game, 560, 620, groups.enemies);

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

    // AStar test
    // game.input.onDown.add(find, this);


};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, "#ff0000");
};

/**
 * Find a path from the turtle to the click event position.
 * From:
 *   http://rafarel-design.com/phaser/examples/
 *      _site/view_full.html?d=plugins&f=astar.js&t=astar
 * And:
 *   http://www.html5gamedevs.com/topic/
 *      3526-discuss-about-phaserplugin-development/
 */
function find(e)
{
    console.log("this is a test...");
    var start = this.game.globals.tileMapLayer.getTileXY(this.game.globals.player.x,
        this.game.globals.player.y + this.game.camera.view.y, {});
    var goal = this.game.globals.tileMapLayer.getTileXY(e.positionDown.x +
        this.game.camera.view.x, e.positionDown.y + this.game.camera.view.y, {});

    var path = this.game.globals.plugins.astar.findPath(start, goal);
}
