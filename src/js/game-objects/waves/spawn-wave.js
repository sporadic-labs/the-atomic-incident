module.exports = SpawnWave;

const ShadowEnemy = require("../enemies/shadow-enemy.js");
const Color = require("../../helpers/Color.js");
const Colors = require("../../constants/colors.js");
const PathTweenWave = require("./path-tween-wave.js");
const WaveShapes = require("./wave-shapes.js");
const WaveComposition = require("./wave-composition.js");

SpawnWave.prototype = Object.create(Phaser.Group.prototype);

function SpawnWave(game) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "directional-wave");

    this._map = this.game.globals.tileMap;
    this._player = this.game.globals.player;
    this._enemiesGroup = enemies;
    this._nonCollidingGroup = this.game.globals.groups.nonCollidingGroup;

    this._startingDelayBetweenWaves = 10000; // ms

    // Fix to make this wave work with maps that don't have spawn points defined
    // in tiled
    // TODO(rt): Probably don't need this anymore...
    this._spawnRegions = this._map.objects["spawn points"] || [];
    if (this._spawnRegions.length === 0) {
        this._spawnRegions.push({
            rectangle: true,
            x: 0,
            y: 0,
            width: this.game.world.width,
            height: this.game.world.height
        }); 
    }
    
    this._possibleWaves = [
        {
            name: "Slow Speed Path Tween - Random Any One Type", 
            wave: new PathTweenWave(
                this.game, WaveComposition.CreateRandOneType(this.game), 50
            ),
            probability: 1/2
        },
        {
            name: "Fast Speed Path Tween - Random Any One Type", 
            wave: new PathTweenWave(
                this.game, WaveComposition.CreateRandOneType(this.game), 100
            ),
            probability: 1/2
        }
    ];

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Spawn after the lighting system has had a chance to update once
    this._timer.add(0, this._spawnCluster.bind(this));
}

SpawnWave.prototype._spawnCluster = function () {
    // // var rndDelay = (this.game.rnd.integerInRange(-5, 5) * 20) + 200;
    // var rndDelay = 0;
    // // NOTE(rt): Prob don't need this anymore, I am just gonna leave it for the moment...
    // var region = this.game.rnd.pick(this._spawnRegions);
    // this._spawnSeriesWithDelay(region, rndDelay);

    const waveType = this._pickWaveType();
    console.log("Spawning " + waveType.name);
    waveType.wave.spawn();

    // Increment the global waveNum
    this.game.globals.waveNum++;
    // NOTE(rt): Hack a difficulty curve...
    // TODO(rt): Get an actually useful curve here...
    var mod = (100 - (this.game.globals.waveNum * 2)) / 100;
    var modDelay = this._startingDelayBetweenWaves * mod;
    // Schedule next spawn
    this._timer.add(modDelay, this._spawnCluster.bind(this));
};

SpawnWave.prototype._pickWaveType = function () {
    // Use a random number between 0 and 1 to do a weighted pick from 
    // this._possibleWaves. A running total is needed to sample the waves. 
    // If the probabilities for the waves are:
    //  0.2, 0.5, 0.3
    // That is really checking if the random number is between:
    //  [0.0 - 0.2], [0.2 - 0.7], [0.7 - 1.0]  
    var rand = this.game.rnd.frac();
    var runningTotal = 0;
    for (const possibleWave of this._possibleWaves) {
        var probability = possibleWave.probability;
        runningTotal += probability;
        if (rand <= runningTotal) return possibleWave;
    }
    // If the probabilities don't add up to one, return the last wave
    return this._possibleWaves[this._possibleWaves.length - 1];
};

SpawnWave.prototype._getSpawnPointInRegion = function (region) {
    // For now, just working with rectangular spawn areas, but tiled supports
    // ellipses/polygons/polylines
    if (!region.rectangle) {
        console.warn("Unsupported spawn point type!");
        return;
    }
    return this._getSpawnPointInRect(region);
};

/**
 * Return a random, empty point (no tile) inside a given region.
 * @param  {Region} rect   -  A description of the region to search for points in.
 *         {Region}: [rectangle : boolean,
 *                    x: number, y: number,
 *                    width: number,
 *                    height: number ]
 * @return {Phaser.Point}  -  An empty point inside the given region (x, y).
 */
SpawnWave.prototype._getSpawnPointInRect = function (rect) {
    var attempts = 0;
    var maxAttempts = 1000;
    while ((attempts < maxAttempts)) {
        attempts++;
        var x = this.game.rnd.integerInRange(rect.x, rect.x + rect.width);
        var y = this.game.rnd.integerInRange(rect.y, rect.y + rect.height);
        if (this._isTileEmpty(x, y)) return new Phaser.Point(x, y);
    }

    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
};

/**
 * Return a random, empty point (no tile) along the circumference of a circle
 * w/ a given radius.
 * @param  {number} radius - Radius of circle.
 * @return {Phaser.Point}  - An empty point along the circle's circumference (x, y).
 */
SpawnWave.prototype._getSpawnPointOnRadius = function (centerX, centerY, radius, index) {
    var attempts = 0;
    var maxAttempts = 1000;
    while ((attempts < maxAttempts)) {
        attempts++;
        // Figure out where each enemy should be placed along the circumference of a circle.

        // var angle = this.game.rnd.realInRange(0, 1) * 2 * Math.PI; // Get a random angle around the circumference.
        // var rndRadius = radius + this.game.rnd.realInRange(-24, 24); // Get a random offset of the given radius.

        var angle = (index / 24) * (2 * Math.PI); // 24 total enemies spawned.

        var x = centerX + (radius * Math.cos(angle));        
        var y = centerY + (radius * Math.sin(angle));
        // If the chosen location isn't in an empty tile, get out!
        if (this._isTileEmpty(x, y)) return new Phaser.Point(x, y);
    }

    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
};

/**
 * A random point at a given index position on  grid w/ a given w and h.
 * @param  {number} xCoord  - X index of point within grid. 
 * @param  {number} yCoord  - Y index of point within the grid. 
 * @param  {number} wNum    - W of grid (in points)
 * @param  {number} hNum    - H of grid (in points)
 * @return {Phaser.Point}   - An empty point at a specific coord position in a grid.
 */
SpawnWave.prototype._getSpawnPointOnGrid = function (wNum, hNum, xCoord, yCoord) {
    // Calculate the coords for each point on a grid.
    var x = (this.game.width / (wNum + 1)) * xCoord;
    var y = (this.game.height / (hNum + 1)) * yCoord;

    if (this._isTileEmpty(x, y)) return new Phaser.Point(x, y);

    console.log('This spot on the Grid already has a tile!')
};

SpawnWave.prototype.destroy = function () {
    this._timer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};

SpawnWave.prototype._isTileEmpty = function (x, y) {
    var map = this.game.globals.tileMap;
    var checkTile = map.getTileWorldXY(x, y, map.tileWidth, map.tileHeight, 
        this.game.globals.tileMapLayer, true);
    // Check if location was out of bounds or invalid (getTileWorldXY returns 
    // null for invalid locations when nonNull param is true)
    if (checkTile === null) return false;
    // Check if tile is empty (getTileWorldXY returns a tile with an index of 
    // -1 when the nonNull param is true)
    if (checkTile.index === -1) return true;
    else return false;
};