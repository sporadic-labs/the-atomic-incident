/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

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
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);
    
    // var FlockingGroup = require("../game-objects/enemies/flocking-group.js");
    // new FlockingGroup(game, 15, player.x, player.y + 200);

    // var WallGroup = require("../game-objects/enemies/wall-group.js");
    // new WallGroup(game, 15);
    
    // var SineGroup = require("../game-objects/enemies/sine-wave-group.js");
    // new SineGroup(game, 45);

    // var SpawnerGroup = require("../game-objects/enemies/spawner-group.js");
    // new SpawnerGroup(game, 4);

    var WeaponPickup = require("../game-objects/pickups/weapon-pickup.js");
    for (var i=0; i<50; i++) {
        new WeaponPickup(this.game, this.game.rnd.integerInRange(0, 1300), 
            this.game.rnd.integerInRange(0, 1300), "gun", 5)
    }

    var SprialGroup = require("../game-objects/enemies/spiral-group.js");
    new SprialGroup(game, 50, player.x, player.y);
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");

    var enemies = this.game.globals.groups.enemies;
    renderBodies(enemies);
};

function renderBodies (element) {
    if (element instanceof Phaser.Sprite) {
        var body = element.body;
        if (body) {
            if (body.isCircle) {
                // Draw exactly what SpriteUtils.satOverlapWithArcadeGroup is 
                // using for collisions...
                element.game.debug.geom(new Phaser.Rectangle(
                    body.x - body.halfWidth, 
                    body.y - body.halfHeight, 
                    body.width, 
                    body.height
                ));
            } else {
                element.game.debug.body(element);                
            }
        }
    } else if (element instanceof Phaser.Group) {
        element.forEach(renderBodies);
    }
}