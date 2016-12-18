module.exports = SpawnPointWave;

var ShadowEnemy = require("../enemies/shadow-enemy.js");
var ShadowBomber = require("../enemies/shadow-bomber.js");

SpawnPointWave.prototype = Object.create(Phaser.Group.prototype);

function SpawnPointWave(game) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "directional-wave");

    this._map = this.game.globals.tileMap;
    this._player = this.game.globals.player;
    this._enemiesGroup = enemies;
    this._nonCollidingGroup = this.game.globals.groups.nonCollidingGroup;

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
    this._spawnSeriesWithDelay(region, 3, 200);
    // Schedule next spawn
    this._timer.add(4000, this._spawnCluster.bind(this));
};

SpawnPointWave.prototype._spawnSeriesWithDelay = function (region, numToSpawn, 
        delay) {
    var numSpawned = 0;
    var delayedSpawn = function () {
        this._spawnInRegion(region);
        numSpawned++;
        if (numSpawned < numToSpawn) this._timer.add(delay, delayedSpawn);
    }.bind(this);
    delayedSpawn();
};

SpawnPointWave.prototype._spawnInRegion = function (region) {
    // For now, just working with rectangular spawn areas, but tiled supports
    // ellipses/polygons/polylines
    if (!region.rectangle) {
        console.warn("Unsupported spawn point type!");
        return;
    }
    this._spawnInRect(region);
};

SpawnPointWave.prototype._spawnInRect = function (rect) {
    var attempts = 0;
    var maxAttempts = 1000;
    var lighting = this.game.globals.plugins.lighting;
    while ((attempts < maxAttempts)) {
        attempts++;
        var x = this.game.rnd.integerInRange(rect.x, rect.x + rect.width);
        var y = this.game.rnd.integerInRange(rect.y, rect.y + rect.height);
        if (this._isTileEmpty(x, y) && 
                lighting.isPointInShadow(new Phaser.Point(x, y))) {
            if (this.game.rnd.frac() < 0.75) {
                new ShadowEnemy(this.game, x, y, this);
            } else {
                new ShadowBomber(this.game, x, y, this);
            }
            return;
        }
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