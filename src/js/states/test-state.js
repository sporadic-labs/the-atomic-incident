const SoundEffectManager = require("../game-objects/sound-effect-manager.js");
const EffectsPlugin = 
    require("../plugins/camera-effects-plugin/camera-effects-plugin.js");
const LevelManager = require("../game-objects/level-manager.js");
const EasyStarPlugin = require("../plugins/easy-star-plugin.js");
const NavMeshPlugin = require("../plugins/navmesh-plugin/navmesh-plugin");
var SatBodyPlugin = require("../plugins/sat-body-plugin/sat-body-plugin.js");
var LightingPlugin = require("../plugins/lighting-plugin/lighting-plugin.js");
var Player = require("../game-objects/player.js");

class TestState {
    
    /**
     * Creates an instance of TestState. Called by Phaser when the state is 
     * registered with the game.
     * 
     * @param {Phaser.Game} game 
     * 
     * @memberOf TestState
     */
    constructor(game) {
        this.game = game;
    }

    create() {
        // Shorthands
        const game = this.game;
        const globals = game.globals;

        // Debugging FPS
        game.time.advancedTiming = true;
        
        // Canvas styling
        game.canvas.style.cursor = "none";
        game.canvas.addEventListener("contextmenu", function(e) {
            e.preventDefault();
        });

        // Groups for z-index sorting and for collisions
        const groups = {
            game: game.add.group(this.world, "game"),
            gameOverlay: game.add.group(this.world, "game-overlay"),
            hud: game.add.group(this.world, "hud")
        };
        groups.background = game.add.group(groups.game, "background");
        groups.midground = game.add.group(groups.game, "midground");
        groups.foreground = game.add.group(groups.game, "foreground");
        groups.enemies = game.add.group(groups.midground, "enemies"),
        groups.nonCollidingGroup = game.add.group(groups.midground, "non-colliding"),
        groups.pickups = game.add.group(groups.foreground, "pickups"),
        globals.groups = groups;

        // Initializing the world
        this.stage.backgroundColor = "#FFF";

        // Plugins
        global.plugins = (global.plugins !== undefined) ? global.plugins : {}; 
        globals.plugins.satBody = game.plugins.add(SatBodyPlugin); 
        globals.plugins.effects = game.plugins.add(EffectsPlugin); 
        globals.plugins.navMesh = game.plugins.add(NavMeshPlugin);
        globals.plugins.satBody = game.plugins.add(SatBodyPlugin);

        // Level manager
        const levelManager = new LevelManager(game, "arcade-map");//, "arcade-map-2");
        globals.levelManager = levelManager;

        // Lighting plugin - needs to be set up after level manager
        globals.plugins.lighting = game.plugins.add(LightingPlugin, groups.foreground); 
        this.lighting = globals.plugins.lighting;
        this.lighting.setOpacity(0.1);

        // Easystarjs plugin
        const easyStar = globals.plugins.easyStar = game.plugins.add(EasyStarPlugin);
        easyStar.setGrid(levelManager.getCurrentWallLayer(), [-1]);
        // Listen for level changes
        levelManager.levelChangeSignal.add(() => {
            globals.plugins.easyStar.setGrid(levelManager.getCurrentWallLayer(), [-1]);
        });
        
        // Sound manager
        globals.soundManager = new SoundEffectManager(this.game);

        // Physics
        this.physics.startSystem(Phaser.Physics.ARCADE);
        this.physics.arcade.gravity.set(0);

        // Player
        // Setup a new player, and attach it to the global variabls object.
        var player = new Player(game, game.width/2, game.height/2, groups.foreground);
        this.camera.follow(player);
        globals.player = player;

        const graphics = game.add.graphics(0, 0);

        this.startPoint = null;
        this.endPoint = null;
        this.game.input.onDown.add(() => {
            // this.startPoint = this._getRandomEmptyPoint();
            // this.endPoint = this._getRandomEmptyPoint();
            // const path = globals.plugins.navMesh.findPath(this.startPoint, this.endPoint, true, true);

            if (!this.startPoint) {
                this.startPoint = game.input.activePointer.position.clone();
                graphics.clear();
                graphics.beginFill(0xffd900);
                graphics.drawEllipse(this.startPoint.x, this.startPoint.y, 10, 10);
                graphics.endFill();
            } else if (!this.endPoint) {
                this.endPoint = game.input.activePointer.position.clone();
                globals.plugins.navMesh.findPath(this.startPoint, this.endPoint, true, true);
                this.startPoint = null;
                this.endPoint = null;
            }
        });

        // Astar vs Navmesh testing

        // const iterations = 1000;
        // const shortPaths = [];
        // const longPaths = [];
        // for (let i = 0; i < (iterations + 1); i += 2) {
        //     shortPaths.push(...this._getRandomPointsWithDistance(50, 150));
        //     longPaths.push(...this._getRandomPointsWithDistance(600));
        // }
        
        // graphics.clear();
        // for (let i = 0; i < iterations - 1; i += 2) {
        //     graphics.lineStyle(1, 0xff0000);
        //     graphics.moveTo(shortPaths[i].x, shortPaths[i].y);
        //     graphics.lineTo(shortPaths[i + 1].x, shortPaths[i + 1].y);
        //     graphics.lineStyle(1, 0x0000ff);
        //     graphics.moveTo(longPaths[i].x, longPaths[i].y);
        //     graphics.lineTo(longPaths[i + 1].x, longPaths[i + 1].y);
        // }

        // let start;
        
        // start = performance.now();
        // for (let i = 0; i < iterations - 1; i++) {
        //     globals.plugins.easyStar.getWorldPath(shortPaths[i], shortPaths[i + 1]);
        // }
        // const shortPathEasyStar = performance.now() - start;

        // start = performance.now();
        // for (let i = 0; i < iterations - 1; i++) {
        //     globals.plugins.navMesh.findPath(shortPaths[i], shortPaths[i + 1]);
        // }
        // const shortPathNavMesh = performance.now() - start;

        // start = performance.now();
        // for (let i = 0; i < iterations - 1; i++) {
        //     globals.plugins.easyStar.getWorldPath(longPaths[i], longPaths[i + 1]);
        // }
        // const longPathEasyStar = performance.now() - start;

        // start = performance.now();
        // for (let i = 0; i < iterations - 1; i++) {
        //     globals.plugins.navMesh.findPath(longPaths[i], longPaths[i + 1]);
        // }
        // const longPathNavMesh = performance.now() - start;


//         console.log(
// `Interations: ${iterations}
// Short Paths (50px - 150px): 
//     EasyStar: 
//         Total: ${shortPathEasyStar.toFixed(2)}ms 
//         Average: ${(shortPathEasyStar / (iterations - 1)).toFixed(2)}ms
//     NavMesh:
//         Total: ${shortPathNavMesh.toFixed(2)}ms
//         Average: ${(shortPathNavMesh / (iterations - 1)).toFixed(2)}ms
//     NavMesh is ${(shortPathEasyStar/shortPathNavMesh).toFixed(2)}x faster
// Long Paths (600px and up): 
//     EasyStar: 
//         Total: ${longPathEasyStar.toFixed(2)}ms
//         Average: ${(longPathEasyStar / (iterations - 1)).toFixed(2)}ms
//     NavMesh: 
//         Total: ${longPathNavMesh.toFixed(2)}ms
//         Average: ${(longPathNavMesh / (iterations - 1)).toFixed(2)}ms
//     NavMesh is ${(longPathEasyStar/longPathNavMesh).toFixed(2)}x faster
// `
//         );

    }
    
    _getRandomEmptyPoint() {
        let x = this.game.rnd.integerInRange(0, this.game.width);
        let y = this.game.rnd.integerInRange(0, this.game.height);
        while (!this._isTileEmpty(x, y)) {
            x = this.game.rnd.integerInRange(0, this.game.width);
            y = this.game.rnd.integerInRange(0, this.game.height);
        }
        return new Phaser.Point(x, y);
    }

    _getRandomPointsWithDistance(minDistance = 0, maxDistance = Number.MAX_VALUE) {
        let p1 = this._getRandomEmptyPoint();
        let p2 = this._getRandomEmptyPoint();
        let d = p1.distance(p2);
        while (d < minDistance || d > maxDistance) {
            p1 = this._getRandomEmptyPoint();
            p2 = this._getRandomEmptyPoint();
            d = p1.distance(p2);
        }
        return [p1, p2];
    }

    _isTileEmpty(x, y) {
        const map = this.game.globals.levelManager.getCurrentTilemap();
        const wallLayer = this.game.globals.levelManager.getCurrentWallLayer();
        var checkTile = map.getTileWorldXY(x, y, 25, 25, wallLayer, true);
        // Check if location was out of bounds or invalid (getTileWorldXY returns 
        // null for invalid locations when nonNull param is true)
        if (checkTile === null) return false;
        // Check if tile is empty (getTileWorldXY returns a tile with an index of 
        // -1 when the nonNull param is true)
        if (checkTile.index === -1) return true;
        else return false;
    }
}

module.exports = TestState;