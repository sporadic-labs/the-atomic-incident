module.exports = SpawnWave;

var ShadowEnemy = require("../enemies/shadow-enemy.js");
var WaveType = require("./wave-type.js");
var Color = require("../../helpers/Color.js");
var ColorOpts = require("../../constants/colors.js")

SpawnWave.prototype = Object.create(Phaser.Group.prototype);

function SpawnWave(game) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "directional-wave");

    this._map = this.game.globals.tileMap;
    this._player = this.game.globals.player;
    this._enemiesGroup = enemies;
    this._nonCollidingGroup = this.game.globals.groups.nonCollidingGroup;

    this._startingDelayBetweenWaves = 24000; // ms

    /**
     * Array of possible wave types where each element is an object that 
     * describes a wave:
     *  {   probability: oddsOfWaveOccuring,
     *      waveType: [ game, NameForDebugging, SpawnPattern, RedNum, GreenNum, BlueNum ] }
     */
    this._waveTypes = [
        {probability: 0.12, waveType: new WaveType(game, "Even Circle", "Circle", 8, 8, 8)},
        {probability: 0.12, waveType: new WaveType(game, "Even Point", "Point", 8, 8, 8)},
        {probability: 0.1, waveType: new WaveType(game, "Even Grid", "Grid", 12, 12, 12)}, // This is a test...
        {probability: 0.12, waveType: new WaveType(game, "Red Circle", "Circle", 12, 6, 6)},
        {probability: 0.1, waveType: new WaveType(game, "Red Point", "Point", 12, 6, 6)},
        {probability: 0.12, waveType: new WaveType(game, "Green Circle", "Circle", 6, 12, 6)},
        {probability: 0.1, waveType: new WaveType(game, "Green Point", "Point", 6, 12, 6)},
        {probability: 0.12, waveType: new WaveType(game, "Blue Circle", "Circle", 6, 6, 12)},
        {probability: 0.1, waveType: new WaveType(game, "Blue Point", "Point", 6, 6, 12)},
    ];

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

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Spawn after the lighting system has had a chance to update once
    this._timer.add(0, this._spawnCluster.bind(this));
}

SpawnWave.prototype._spawnCluster = function () {
    // var rndDelay = (this.game.rnd.integerInRange(-5, 5) * 20) + 200;
    var rndDelay = 0;
    // NOTE(rt): Prob don't need this anymore, I am just gonna leave it for the moment...
    var region = this.game.rnd.pick(this._spawnRegions);
    this._spawnSeriesWithDelay(region, rndDelay);

    // Increment the global waveNum
    this.game.globals.waveNum++;
    // NOTE(rt): Hack a difficulty curve...
    // TODO(rt): Get an actually useful curve here...
    var mod = (100 - (this.game.globals.waveNum * 2)) / 100;
    var modDelay = this._startingDelayBetweenWaves * mod;
    // Schedule next spawn
    this._timer.add(modDelay, this._spawnCluster.bind(this));
};

SpawnWave.prototype._spawnSeriesWithDelay = function (region, delay) {
    // Pick a wave type and get the first enemy
    var waveType = this._pickWaveType();
    waveType.startNewSpawn();
    var enemyTypeToSpawn = waveType.getNextEnemyType();
    var cntr = 0; // Counter for enemies.
    var playerOrMap = this.game.rnd.sign(); // 1 = player, -1 = map.

    // Log something for debugging.
    playerOrMap > 0 ? console.log(waveType.name + " around player.") : console.log(waveType.name + " around map.");


    // Spawn the enemies in the wave with a small delay between each enemy
    var delayedSpawn = function () {
        cntr++; // Increment counter.
        var spawnPoint;
        if (waveType.pattern === "Point") {
            spawnPoint = this._getSpawnPointInRegion(region);
        } else if (waveType.pattern === "Circle") {
            if (playerOrMap < 0) { // map
                spawnPoint = this._getSpawnPointOnRadius(
                    this.game.width / 2,
                    this.game.height / 2,
                    300,
                 );
            } else { // player
                spawnPoint = this._getSpawnPointOnRadius(
                    this._player.position.x,
                    this._player.position.y,
                    80,
                );
            }
        } else if (waveType.pattern === "Grid") {
            var gridW = 8; // TODO(rt): Should these be modified ever?
            var gridH = 8; // TODO(rt): Should these be modified ever?
            var yCoord = cntr % gridW;
            var xCoord = cntr - (gridH * yCoord);
            spawnPoint = this._getSpawnPointOnGrid(gridW, gridH, xCoord, yCoord);
        }

        if (!spawnPoint) {
            // If no value spawn point was found, skip spawning the enemy!
            // Otherwise, figure out what color the enemy is supposed to be and spawn it!
        } else if (enemyTypeToSpawn === "red") {
            new ShadowEnemy(this.game, spawnPoint.x, spawnPoint.y, this, ColorOpts.red);
        } else if (enemyTypeToSpawn === "blue") {
            new ShadowEnemy(this.game, spawnPoint.x, spawnPoint.y, this, ColorOpts.blue);
        } else if (enemyTypeToSpawn === "green") {
            new ShadowEnemy(this.game, spawnPoint.x, spawnPoint.y, this, ColorOpts.green);
        }
        enemyTypeToSpawn = waveType.getNextEnemyType();
        if (enemyTypeToSpawn) this._timer.add(delay, delayedSpawn);
    }.bind(this);
    delayedSpawn();
};

SpawnWave.prototype._pickWaveType = function () {
    // Use a random number between 0 and 1 to do a weighted pick from 
    // this._waveProbabilities. A running total is needed to sample the waves. 
    // If the probabilities for the waves are:
    //  0.2, 0.5, 0.3
    // That is really checking if the random number is between:
    //  [0.0 - 0.2], [0.2 - 0.7], [0.7 - 1.0]  
    var rand = this.game.rnd.frac();
    var runningTotal = 0;
    for (var i = 0; i < this._waveTypes.length; i++) {
        var probability = this._waveTypes[i].probability;
        runningTotal += probability;
        if (rand <= runningTotal) return this._waveTypes[i].waveType;
    }
    // If the probabilities don't add up to one, return the last wave
    return this._waveTypes[i - 1].waveType;
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
SpawnWave.prototype._getSpawnPointOnRadius = function (centerX, centerY, radius) {
    var attempts = 0;
    var maxAttempts = 1000;
    while ((attempts < maxAttempts)) {
        attempts++;
        // Figure out where each enemy should be placed along the circumference of a circle.
        var angle = this.game.rnd.realInRange(0, 1) * 2 * Math.PI; // Get a random angle around the circumference.
        var rndRadius = radius + this.game.rnd.realInRange(-24, 24); // Get a random offset of the given radius.
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