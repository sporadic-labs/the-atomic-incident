module.exports = SpawnPointWave;

var ShadowEnemy = require("../enemies/shadow-enemy.js");
var ShadowBomber = require("../enemies/shadow-bomber.js");
var WaveType = require("./wave-type.js");

SpawnPointWave.prototype = Object.create(Phaser.Group.prototype);

function SpawnPointWave(game) {
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
     *  { probability: oddsOfWaveOccuring, enemyName: fractionOfTotalEnemies, 
     *      ..., total: numEnemiesInWave, name: nameForDebugging }
     */
    this._waveTypes = [
        {probability: 0.0, waveType: new WaveType(game, "Bombers", 0, 11)},
        {probability: 1.0, waveType: new WaveType(game, "Attackers", 14, 0)},
        {probability: 0.0, waveType: new WaveType(game, "Mixed", 10, 5)},
        {probability: 0.0, waveType: new WaveType(game, "AttackersRush", 18, 0)}
    ];

    // Fix to make this wave work with maps that don't have spawn points defined
    // in tiled
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

SpawnPointWave.prototype._spawnCluster = function () {
    var region = this.game.rnd.pick(this._spawnRegions);
    var rndDelay = (this.game.rnd.integerInRange(-5, 5) * 20) + 200;
    this._spawnSeriesWithDelay(region, rndDelay);
    // Increment the global waveNum
    this.game.globals.waveNum++;
    // NOTE(rex): Hack a difficulty curve...
    // TODO(rex): This should be better...
    var mod = (100 - (this.game.globals.waveNum * 2)) / 100;
    var modDelay = this._startingDelayBetweenWaves * mod;
    // Schedule next spawn
    this._timer.add(modDelay, this._spawnCluster.bind(this));
};

SpawnPointWave.prototype._spawnSeriesWithDelay = function (region, delay) {
    // Pick a wave type and get the first enemy
    var waveType = this._pickWaveType();
    waveType.startNewSpawn();
    var enemyTypeToSpawn = waveType.getNextEnemyType();

    
    // Spawn the enemies in the wave with a small delay between each enemy
    var delayedSpawn = function () {
        var spawnPoint = this._getSpawnPointInRegion(region);
        if (enemyTypeToSpawn === "bomber") {
            new ShadowBomber(this.game, spawnPoint.x, spawnPoint.y, this);
        } else if (enemyTypeToSpawn === "attacker") {
            new ShadowEnemy(this.game, spawnPoint.x, spawnPoint.y, this);
        }
        enemyTypeToSpawn = waveType.getNextEnemyType();
        if (enemyTypeToSpawn) this._timer.add(delay, delayedSpawn);
    }.bind(this);
    delayedSpawn();
};

SpawnPointWave.prototype._pickWaveType = function () {
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

SpawnPointWave.prototype._getSpawnPointInRegion = function (region) {
    // For now, just working with rectangular spawn areas, but tiled supports
    // ellipses/polygons/polylines
    if (!region.rectangle) {
        console.warn("Unsupported spawn point type!");
        return;
    }
    return this._getSpawnPointInRect(region);
};

SpawnPointWave.prototype._getSpawnPointInRect = function (rect) {
    var attempts = 0;
    var maxAttempts = 1000;
    var lighting = this.game.globals.plugins.lighting;
    while ((attempts < maxAttempts)) {
        attempts++;
        var x = this.game.rnd.integerInRange(rect.x, rect.x + rect.width);
        var y = this.game.rnd.integerInRange(rect.y, rect.y + rect.height);
        var p = new Phaser.Point(x, y);
        if (this._isTileEmpty(x, y) && lighting.isPointInShadow(p)) return p;
    }

    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
};

SpawnPointWave.prototype.destroy = function () {
    this._timer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};

SpawnPointWave.prototype._isTileEmpty = function (x, y) {
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
}