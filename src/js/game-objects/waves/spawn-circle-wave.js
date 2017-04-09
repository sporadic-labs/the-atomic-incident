module.exports = SpawnCircleWave;

var ShadowEnemy = require("../enemies/shadow-enemy.js");
var ColorOpts = require("../../constants/colors.js")

SpawnCircleWave.prototype = Object.create(Phaser.Group.prototype);

function SpawnCircleWave(game) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "directional-wave");

    this._map = this.game.globals.tileMap;
    this._player = this.game.globals.player;
    this._enemiesGroup = enemies;
    this._nonCollidingGroup = this.game.globals.groups.nonCollidingGroup;

    this._startingDelayBetweenWaves = 14000; // ms

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Spawn after the lighting system has had a chance to update once
    this._timer.add(0, this._spawnCluster.bind(this));
}

SpawnCircleWave.prototype._spawnCluster = function () {
    // Should you be able to customize the radius/position of this circle?
    // NOTE(rex): Right now it starts from the center of the map, and always
    // puts enemies in the exact same spot.
    var numToSpawn = 16;
    var radius = 320;
    var centerX = this.game.world.width / 2;
    var centerY = this.game.world.height / 2;
    for (var i = 0; i < numToSpawn; i += 1) {
        // Choose a random color for each enemy spawned in a group.
        // NOTE(rex): This should probably be a bit more deliberate in the future, especially
        // if we are going to show the next color of enemy to be spawned.
        var colorNum = this.game.rnd.integerInRange(1, 3);
        var enemyColor;
        if (colorNum === 1) {
            enemyColor = ColorOpts.red;
        } else if (colorNum === 2) {
            enemyColor = ColorOpts.green;
        } else if (colorNum === 3) {
            enemyColor = ColorOpts.blue;
        }

        // Figure out where each enemy should be placed along the circumference of a circle.
        var rndAngle = this.game.rnd.realInRange(0, 1); // randomize the angle of each enemy inside of the circle.
        var angle = (i / numToSpawn) * (rndAngle * 2 * Math.PI);
        var enemyX = centerX + (radius * Math.cos(angle));        
        var enemyY = centerY + (radius * Math.sin(angle));
        // If the chosen location isn't in an empty tile, get out!
        if (!this._isTileEmpty(enemyX, enemyY)) continue;
        // Otherwise put a new shadow enemy down!          
        new ShadowEnemy(this.game, enemyX, enemyY, this, enemyColor);
    }

    // Increment the global waveNum
    this.game.globals.waveNum++;

    // NOTE(rex): Hack a difficulty curve...
    var curve = 1 - ( 1 / ( this.game.globals.waveNum ) );
    var modDelay = this._startingDelayBetweenWaves * curve;

    // Schedule next spawn
    this._timer.add(modDelay, this._spawnCluster.bind(this));
};

SpawnCircleWave.prototype.destroy = function () {
    this._timer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};

SpawnCircleWave.prototype._isTileEmpty = function (x, y) {
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