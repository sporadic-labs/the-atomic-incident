/**
 * Sandbox - this is the main level for now
 */

module.exports = Sandbox;

require("../plugins/AStar.js");

var utils = require("../helpers/utilities.js");
var lightUtils = require("../game-objects/lights/light-utilities.js");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");
var ScoreKeeper = require("../helpers/score-keeper.js");
var HeadsUpDisplay = require("../game-objects/heads-up-display.js");
var DebugDisplay = require("../game-objects/debug-display.js");
var DestructableLight = require("../game-objects/destructable-light.js");
var Tower = require("../game-objects/towers/tower.js");
var TargetingTower = require("../game-objects/towers/targeting-tower.js");
var ProjectileTower = require("../game-objects/towers/projectile-tower.js");
var AnimatedLight = require("../game-objects/lights/animated-light.js");
var Color = require("../helpers/Color.js");

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
    global.plugins = (global.plugins !== undefined ) ? global.plugins : {}; 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin); 
    globals.plugins.astar = game.plugins.add(Phaser.Plugin.AStar); 
    globals.plugins.lighting = game.plugins.add(LightingPlugin, 
        groups.foreground, wallLayer); 
    globals.plugins.satBody = game.plugins.add(SatBodyPlugin);
    this.lighting = globals.plugins.lighting;
    // AStar plugin
    globals.plugins.astar.setAStarMap(map, "walls", "tiles_25");

    // Hack: make tiles visible over top of lighting layer
    var tiles = wallLayer.getTiles(0, 0, this.world.width, this.world.height);
    tiles.forEach(function (t) {
        t.alpha = 0.6;
    });
    wallLayer.bringToTop();

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    // Player
    // Get the Spawn Point(s) for the player from the tile map.
    var playerStartPoint = this.getMapPoints("player")[0]; // temp fix
    // Setup a new player, and attach it to the global variabls object.
    var player = new Player(game, playerStartPoint.x, playerStartPoint.y, 
        groups.foreground);
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
    // this.mouseLight = this.lighting.addLight(new Phaser.Point(400, 400),
    //     new Phaser.Circle(0, 0, 200), 0xFFFFFFFF);

    // Array of Towers added to the scene.
    globals.towers = [];
    // A list of all towers
    globals.towerList = [
        "circular",
        "spotlight",
        "targeting",
        "projectile"
    ];
    // A reference for the light you are about to place.
    globals.towerToPlace = null;
    // Use the J key to choose the pulse light as the next light to be added
    var selectLightKey = game.input.keyboard.addKey(Phaser.Keyboard.J);
    selectLightKey.onDown.add(function () {
        if (globals.towerToPlace === null ||
            globals.towerToPlace > globals.towerList.length - 1) {
            globals.towerToPlace = 0
        } else {
            globals.towerToPlace++;
        }
    }, this);
    // Allow the user to select towers using the number keys.
    // 1 = Targeting Tower
    var targetingLightKey = game.input.keyboard.addKey(Phaser.Keyboard.ONE);
    targetingLightKey.onDown.add(function () {
        globals.towerToPlace = 0
    }, this);
    // 2 = Pulsing Tower
    var pulseLightKey = game.input.keyboard.addKey(Phaser.Keyboard.TWO);
    pulseLightKey.onDown.add(function () {
        globals.towerToPlace = 1
    }, this);
    // 3 = Rotating Tower
    var rotatingLightKey = game.input.keyboard.addKey(Phaser.Keyboard.THREE);
    rotatingLightKey.onDown.add(function () {
        globals.towerToPlace = 2
    }, this);
    // 4 = Projectile Tower
    var projectileLightKey = game.input.keyboard.addKey(Phaser.Keyboard.FOUR);
    projectileLightKey.onDown.add(function () {
        globals.towerToPlace = 3
    }, this);

    // Use the space bar place your selected light at the players position
    var placeLightKey = game.input.keyboard.addKey(Phaser.Keyboard.SPACEBAR);
    placeLightKey.onDown.add(function () {
        var player = this.game.globals.player;
        this.placeTower(player.position.x, player.position.y);
    }, this);

    // Score
    globals.scoreKeeper = new ScoreKeeper();

    // HUD
    globals.hud = new HeadsUpDisplay(game, groups.foreground);
    globals.debugDisplay = new DebugDisplay(game, groups.foreground);
    
    
    // var Wave1 = require("../game-objects/waves/wave-1.js");
    // new Wave1(game);

    // Construct an array of arrays, containing the list of points in
    // world coordinates of each possible enemy path.
    var enemyPathsRaw = utils.default(map.objects["enemy paths"], []);
    var enemyPaths = [];
    for (var i = 0; i < enemyPathsRaw.length; i++) {
        var pathNodes = utils.default(enemyPathsRaw[i].polyline, []);
        var startX = enemyPathsRaw[i].x;
        var startY = enemyPathsRaw[i].y;
        var tempPaths = [];
        for (var j = 0; j < pathNodes.length; j++) {
            tempPaths.push(new Phaser.Point(startX + pathNodes[j][0], startY + pathNodes[j][1]));
        }
        enemyPaths.push(tempPaths);
    }
    globals.enemyPaths = enemyPaths;

    // Keep track of what wave the player is on using the globals object.
    var waveNum = 0;
    globals.waveNum = waveNum;

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
    
    // Teleport using world position
    var teleportKey = game.input.keyboard.addKey(Phaser.Keyboard.T);
    teleportKey.onDown.add(function () {
        var player = this.game.globals.player;
        player.position.setTo(
            this.input.mousePointer.x + this.camera.x,
            this.input.mousePointer.y + this.camera.y
        );
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
    // this.mouseLight.position.setTo(
    //     this.input.mousePointer.x + this.camera.x,
    //     this.input.mousePointer.y + this.camera.y
    // );

    var globals = this.game.globals;
    // If the user has right-clicked on the map, and a tower has been selected...
    if (this.game.input.activePointer.rightButton.isDown) {
        var player = this.game.globals.player;
        this.placeTower(player.position.x, player.position.y);
    }
};

Sandbox.prototype.placeTower = function (x, y) {
    var globals = this.game.globals;
    var towerPoint = new Phaser.Point(x, y);
    var tower;
    var parent = globals.groups.midground;
    var lighting = globals.plugins.lighting;
    if (globals.towerToPlace === 0 && globals.player.coins >= 20) {
        // Static, circular light with low damage
        var circularLight = lighting.addLight(towerPoint,
            new Phaser.Circle(0, 0, 400), 
            new Color("rgba(255, 255, 255, 0.5)"));
        tower = new Tower(this.game, x, y, parent, 20, 10, circularLight);
        globals.towers.push(tower);
        globals.player.coins -= tower.value;
    } else if (globals.towerToPlace === 1 && globals.player.coins >= 20) {
        // Static, spotlight with high damage
        var spotPoly = lightUtils.generateSpotlightPolygon(0, 45, 250);
        var spotlight = lighting.addLight(towerPoint, spotPoly, 
            new Color("rgba(255, 255, 255, 0.75)"));
        tower = new Tower(this.game, x, y, parent, 20, 40, spotlight);
        globals.towers.push(tower);
        globals.player.coins -= tower.value;
    } else if (globals.towerToPlace === 2 && globals.player.coins >= 30) {
        // Targeting tower
        tower = new TargetingTower(this.game, x, y, parent, 20, 100);
        globals.towers.push(tower);
        globals.player.coins -= tower.value;
    } else if (globals.towerToPlace === 3 && globals.player.coins >= 30) {
        // Projectile tower
        tower = new ProjectileTower(this.game, x, y, parent, 20, 100);
        globals.towers.push(tower);
        globals.player.coins -= tower.value;
    }
    globals.towerToPlace = null;
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

    // Draw enemy paths for the current level
    // for (var i = 0; i < this.game.globals.enemyPaths.length; i++) {
    //     var path = this.game.globals.enemyPaths[i];
    //     for (var p = 1; p < path.length; p++) {
    //         this.game.debug.geom(path[p]);
    //         this.game.debug.geom(new Phaser.Line(
    //             path[p - 1].x, path[p - 1].y, path[p].x, path[p].y
    //         ));
    //     }
    // }
};

Sandbox.prototype.shutdown = function () {
    // Destroy all plugins (MH: should we be doing this or more selectively
    // removing plugins?)
    this.game.plugins.removeAll();
};