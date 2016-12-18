module.exports = ShadowGroup;

var ShadowEnemy = require("./shadow-enemy");

ShadowGroup.prototype = Object.create(Phaser.Group.prototype);

function ShadowGroup(game, numToSpawn) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "shadow-group");
    this.spawnInShadow(numToSpawn);
}

ShadowGroup.prototype.spawnInShadow = function(numToSpawn) {
    var lighting = this.game.globals.plugins.lighting;

    var numSpawned = 0;
    var attempts = 0;
    var maxAttempts = 1000;
    while ((numSpawned < numToSpawn) && (attempts < maxAttempts)) {
        attempts++;
        var x = this.game.world.randomX;
        var y = this.game.world.randomY;
        if (this._isTileEmpty(x, y) && 
                lighting.isPointInShadow(new Phaser.Point(x, y))) {
            attempts = 0;
            numSpawned++;
            new ShadowEnemy(this.game, x, y, this);
        }
    }

    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
}

ShadowGroup.prototype._isTileEmpty = function (x, y) {
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