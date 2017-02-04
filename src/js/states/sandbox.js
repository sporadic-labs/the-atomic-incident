/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

require("../plugins/AStar.js");

var utils = require("../helpers/utilities.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var DestructableLight = require("../game-objects/destructable-light.js");
var Tower = require("../game-objects/towers/tower.js");
var AnimatedLight = require("../game-objects/lights/animated-light.js");

function Sandbox() {}

Sandbox.prototype.create = function () {
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
    groups.chargingStations = game.add.group(groups.midground, 
        "charging-stations");
    groups.lights = game.add.group(groups.midground, "lights");
    globals.groups = groups;

    // Initializing the world
    this.stage.backgroundColor = "#F9F9F9";

    // Loading the tilemap
    var map = game.add.tilemap("tilemap");
    // Set up the tilesets. First parameter is name of tileset in Tiled and 
    // second paramter is name of tileset image in Phaser's cache
    map.addTilesetImage("tiles_25", "coloredTiles");
    var wallTileset = map.addTilesetImage("wall-tiles", "wallTiles");
    // Create a layer for each 
    var backgroundLayer = map.createLayer("bg", this.game.width, 
        this.game.height, groups.background);
    backgroundLayer.resizeWorld();
    var wallLayer = map.createLayer("walls", this.game.width, this.game.height, 
        groups.foreground);
    map.setCollisionBetween(wallTileset.firstgid, wallTileset.firstgid + 
        wallTileset.total, true, wallLayer);
    globals.tileMap = map;
    globals.tileMapLayer = wallLayer;

    // Plugins
    globals.plugins = {
        satBody: game.plugins.add(SatBodyPlugin),
        astar: game.plugins.add(Phaser.Plugin.AStar),
        lighting: game.plugins.add(LightingPlugin, groups.foreground, wallLayer)
    };
    this.lighting = globals.plugins.lighting;
    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "walls", "tiles_25");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Get the Spawn Point(s) for the player from the tile map.
    var playerStartPoint = this.getMapPoints("player")[0]; // temp fix
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, playerStartPoint.x, playerStartPoint.y, 
        groups.midground);
    this.camera.follow(player);
    globals.player = player;
    
    // this.playerLight = new CarriableLight(game, player.position.x + 25, 
    //     player.position.y, groups.lights, 300, 0xFFFFFFFF, 100);
    
    // // Spawn charging stations in the rooms of the map
    // var rooms = utils.default(map.objects["rooms"], []); // Default to empty
    // if (rooms.length) {
    //     var numStations = Math.floor(rooms.length / 3);
    //     var shuffledRooms = utils.shuffleArray(rooms.slice(0));
    //     for (var i = 0; i < numStations; i++) {
    //         var room = shuffledRooms[i];
    //         var x = room.x + (room.width / 2);
    //         var y = room.y + (room.height / 2);
    //         new ChargingStation(game, x, y, groups.chargingStations, 50);
    //     }
    // }
    
    // Create lights
    var lights = utils.default(map.objects["lights"], []); // Default to empty
    lights.forEach(function (light) {
        var x, y, radius;
        var p = light.properties || {};
        if (light.ellipse) {
            // Newer format for lights - using ellipses in Tiled
            x = light.x + (light.width / 2);
            y = light.y + (light.height / 2);
            radius = light.width / 2;
        } else {
            // Fallback to support old format using tiles
            x = light.x + map.tileWidth / 2;
            y = light.y - map.tileHeight / 2;
            radius = p.radius ? Number(p.radius) : 300;
        }
        var color = p.color ? utils.tiledColorToRgb(p.color) : 0xFFFFFFFF;
        var health = p.health ? Number(p.health) : 100;
        new DestructableLight(game, x, y, groups.lights, radius, color, 
            health);
    }, this);

    // Generate a circle light at the mouse
    this.mouseLight = this.lighting.addLight(new Phaser.Point(400, 400), 
        new Phaser.Circle(0, 0, 200), 0xFFFFFFFF);

    // Array of Towers added to the scene.
    globals.towers = [];
    // A list of all towers
    globals.towerList = [
        "pulse",
        "rotating",
        "contracting"
    ];
    // A reference for the light you are about to place.
    globals.towerToPlace = 0;
    // Use the J key to choose the pulse light as the next light to be added
    var selectLightKey = game.input.keyboard.addKey(Phaser.Keyboard.J);
    selectLightKey.onDown.add(function () {
        if (globals.towerToPlace > globals.towerList.length - 1) {
            globals.towerToPlace = 0
        } else {
            globals.towerToPlace++;
        }
    }, this);

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    var SpawnerWave = require("../game-objects/waves/spawn-point-wave.js");
    globals.spawnEnemies = new SpawnerWave(game);

    var SpawnPickups = require("../game-objects/pickups/spawn-pickups.js");
    globals.spawnPickups = new SpawnPickups(game);


    // Menu for switching tile maps
    var menu = [];
    var x = game.width - 36;
    for (var i = 0; i < globals.tilemapFiles.length; i++) {
        // The callback needs a reference to the value of i on each iteration,
        // so create a callback with binding
        var cb = game.state.start.bind(game.state, "load", true, true, 
            "resources/tilemaps/" + globals.tilemapFiles[i]);
        var b = game.add.button(x, (36 * i) + 4, "button", cb);
        b.fixedToCamera = true;
        menu.push(b);
    }
    this.menu = menu;

    // Toggle debugging SAT bodies
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    debugToggleKey.onDown.add(function () {
        if (globals.plugins.satBody.isDebugAllEnabled()) {
            globals.plugins.satBody.disableDebugAll();
            globals.plugins.lighting.disableDebug();
        } else {
            globals.plugins.satBody.enableDebugAll();
            globals.plugins.lighting.enableDebug();
        }
    }, this);

    // Simple pause menu
    var textStyle = {font: "18px Arial", fill: "#9C9C9C"};
    var pauseText = this.game.add.text(this.game.width - 20, 
        this.game.height - 5, "Pause", textStyle);
    pauseText.fixedToCamera = true;
    pauseText.inputEnabled = true;
    pauseText.anchor.set(1, 1);
    pauseText.events.onInputDown.add(function () {
        game.paused = true;
        pauseText.text = "Play";
        function unpause() {
            game.paused = false;
            pauseText.text = "Pause";
            this.game.input.onDown.remove(unpause, this);
        }
        this.game.input.onDown.add(unpause, this);
    }, this);
};

Sandbox.prototype.getMapPoints = function(key) {
    // There could be more than 1 map point per type...
    var mapPoints = [];
    // We are searching the current tile map layer.
    var map = this.game.globals.tileMap;
    // If the current key exists...
    if (map.objects[key]) {
        // For each object with the current key.
        var objects = map.objects[key];
        for (var i = 0; i < objects.length; i++) {
            mapPoints.push({
                x: objects[i].x,
                y: objects[i].y
            })
        }
    }
    return mapPoints;
};

Sandbox.prototype.update = function () {
    this.mouseLight.position.setTo(
        this.input.mousePointer.x + this.camera.x,
        this.input.mousePointer.y + this.camera.y
    );
    
    // If the user has clicked on the table...
    if (this.game.input.activePointer.isDown) {
        var globals = this.game.globals;
        var x = this.input.mousePointer.x + this.camera.x;
        var y = this.input.mousePointer.y + this.camera.y;
        var mousePoint = new Phaser.Point(x, y);
        var parent = this.game.globals.groups.midground;
        // Check the map for a tile at the mouse position
        var checkTile = globals.tileMap.getTileWorldXY(x, y, 
            globals.tileMap.tileWidth, globals.tileMap.tileHeight, 
            globals.tileMapLayer);
        // Mouse is over valid tile
        if (checkTile === null || checkTile === undefined) {
            var tower;
            if (globals.towerToPlace === 0) {
                // Pulse light tower
                var pulsingLight = AnimatedLight.createPulsingCircle(this.game, 
                    mousePoint, new Phaser.Circle(0, 0, 300), 
                    0x8DCDE3FF, 1000);
                tower = new Tower(this.game, x, y, parent, 25, 20, 
                    pulsingLight);
                globals.towers.push(tower);
                globals.towerToPlace = null;
                globals.player.coins -= tower.value;
            } else if (globals.towerToPlace === 1) {
                // Rotating spotlight tower
                var rotatingLight = AnimatedLight.createRotatingSpotlight(
                    this.game, mousePoint, 0, 60, 240, 0x8DCDE3FF, 90);
                tower = new Tower(this.game, x, y, parent, 25, 100,
                    rotatingLight);
                globals.towers.push(tower);
                globals.towerToPlace = null;
                globals.player.coins -= tower.value;
            } else if (this.game.globals.towerToPlace === 2) {
                // Contracting light tower
                var contractingLight = AnimatedLight.createContractingCircle(
                    this.game, mousePoint, new Phaser.Circle(0, 0, 300), 
                    0x8DCDE3FF, 1000);
                tower = new Tower(this.game, x, y, parent, 25, 50,
                    contractingLight);
                globals.towers.push(tower);
                globals.towerToPlace = null;
                globals.player.coins -= tower.value;
                
            }
        }
    }
};

Sandbox.prototype.render = function () {
    this.game.debug.text(this.game.time.fps, 5, 15, "#A8A8A8");
    // this.game.debug.AStar(this.game.globals.plugins.astar, 20, 20, 
    //  "#ff0000");

    // this.game.globals.groups.chargingStations.forEach(function (station) {
    //     this.game.debug.body(station);
    // }, this);
    // this.game.globals.groups.lights.forEach(function (light) {
    //     this.game.debug.body(light);
    // }, this);
};

Sandbox.prototype.shutdown = function () {
    // Destroy all plugins (MH: should we be doing this or more selectively
    // removing plugins?)
    this.game.plugins.removeAll();
};