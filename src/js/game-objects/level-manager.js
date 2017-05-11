const calculateHull = require("../plugins/lighting-plugin/hull-from-tiles.js");

/**
 * A class for managing and switching between multiple maps. It assumes that 
 * each map:
 * 
 * 1) Has the same fixed size
 * 2) Uses a common set of tileset images: 
 *  Image name: "tiles_25", Phaser key: "coloredTiles"
 *  Image name: "wall-tiles", Phaser key: "wallTiles"
 * 3) Uses two Tiled layers called: "bg" and "walls"
 * 
 * @class LevelManager
 */
class LevelManager {
    
    /**
     * Creates an instance of LevelManager.
     * 
     * @param {Phaser.Game} game
     * @param {...string} tilemapKeys Any number of keys that correspond to 
     * Tiled tilemaps in Phaser's cache 
     * 
     * @memberOf LevelManager
     */
    constructor(game, ...tilemapKeys) {
        this.game = game;
        this._navMeshPlugin = this.game.globals.plugins.navMesh;

        // Load the tilemaps from the cache
        this._maps = [];
        for (const key of tilemapKeys) {
            this._maps.push(this._loadMap(key));
        }

        /**
         * @property {Phaser.Signal} levelChangeSignal Signal that is fired when levels are changed
         */
        this.levelChangeSignal = new Phaser.Signal();

        // Show the first map
        this._loadedMapIndex = 0;
        // this._maps[this._loadedMapIndex].bgLayer.visible = true;
        this._maps[this._loadedMapIndex].wallLayer.visible = true;
        this._navMeshPlugin.switchLevel(this._maps[this._loadedMapIndex].key);
    }

    /**
     * Switches to the tilemap indicated by the index (if the index is in range)
     * and dispatches a message to anyone listening to 
     * LevelManager#levelChangeSignal
     * 
     * @param {number} index
     * 
     * @memberOf LevelManager
     */
    switchMap(index) {
        // Only switch if the index is in range and we aren't already at index
        if (index >= this._maps.length || index === this._loadedMapIndex) return;

        // Grab the maps
        const lastMap = this._maps[this._loadedMapIndex];
        const newMap = this._maps[index];

        // Fade the new map in and flash a couple of times at a low opacity
        newMap.wallLayer.parent.bringToTop(newMap.wallLayer);
        newMap.wallLayer.visible = true;
        newMap.wallLayer.alpha = 0;
        const t1 = this.game.add.tween(newMap.wallLayer)
            .to({alpha: 0.15}, 100, Phaser.Easing.Quadratic.InOut)
            .to({alpha: 0.25}, 350, Phaser.Easing.Quadratic.InOut, false, 0, 1, true)
            .to({alpha: 0.35}, 500, Phaser.Easing.Quadratic.InOut)
            .start();
        
        // When that finishes, tween alphas to switch maps
        const t2 = this.game.add.tween(newMap.wallLayer).to({alpha: 1}, 400, 
            Phaser.Easing.Quadratic.InOut);
        const t3 = this.game.add.tween(lastMap.wallLayer).to({alpha: 0}, 200, 
            Phaser.Easing.Quadratic.InOut);
        t1.onComplete.add(() => {
            t2.start();
            t3.start();
        });

        // Finally when the last map has tweened out, we have switching maps    
        t3.onComplete.add(() => {
            lastMap.wallLayer.visible = false;
            this._loadedMapIndex = index;
            this._navMeshPlugin.switchLevel(this._maps[index].key);
            this.levelChangeSignal.dispatch(index);
        });
    }

    /**
     * @returns {number} 
     * @memberOf LevelManager
     */
    getCurrentLevelIndex() {
        return this._loadedMapIndex;
    }
    
    /**
     * @returns {Phaser.Tilemap} 
     * @memberOf LevelManager
     */
    getCurrentTilemap() {
        return this._maps[this._loadedMapIndex].tilemap;
    }

    /**
     * @returns {Phaser.TilemapLayer} 
     * @memberOf LevelManager
     */
    getCurrentWallLayer() {
        return this._maps[this._loadedMapIndex].wallLayer;
    }

    /**
     * @returns {walls[]} An array of walls from the hull calculation
     * @memberOf LevelManager
     */
    getCurrentWalls() {
        return this._maps[this._loadedMapIndex].walls;
    }

    _loadMap(key) {
        const g = this.game;
        const bgGroup = g.globals.groups.background;
        const fgGroup = g.globals.groups.foreground;

        // Load the map from the Phaser cache
        const tilemap = g.add.tilemap(key);

        // Set up the tilesets. First parameter is name of tileset in Tiled and 
        // second paramter is name of tileset image in Phaser's cache
        tilemap.addTilesetImage("tiles_25", "coloredTiles");
        const wallTileset = tilemap.addTilesetImage("wall-tiles", "wallTiles");

        // Create the background and wall layers
        const bgLayer = tilemap.createLayer("bg", g.width, g.height, bgGroup);
        const wallLayer = tilemap.createLayer("walls", g.width, g.height, 
            fgGroup);
        bgLayer.visible = false;
        wallLayer.visible = false;
        
        // Set up collisions
        tilemap.setCollisionBetween(wallTileset.firstgid, wallTileset.firstgid +
            wallTileset.total, true, wallLayer);

        // Calculate an array of walls for lighting calculations
        const hulls = calculateHull(wallLayer);
        const walls = [];
        for (const wallCluster of hulls) {
            for (const wall of wallCluster) {
                walls.push(wall);
            }
        }
        
        // Load the navmesh from the tilemap object layer "navmesh"
        const navMesh = this._navMeshPlugin.buildMeshFromTiled(key, tilemap, "navmesh");

        return {key, tilemap, bgLayer, wallLayer, navMesh, walls};
    }

}

module.exports = LevelManager;