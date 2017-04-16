module.exports = PickupSpawner;

var colors = require("../../constants/colors.js");
var LightPickup = require("./light-pickup.js");

PickupSpawner.prototype = Object.create(Phaser.Group.prototype);

function PickupSpawner(game) {
    var pickupGroup = game.globals.groups.pickups;
    Phaser.Group.call(this, game, pickupGroup, "pickup-spawner");
}

PickupSpawner.prototype.update = function () {
    if (this.children.length === 0) {
        this._spawnPickup("red");
        this._spawnPickup("blue");
        this._spawnPickup("green");
    }
    Phaser.Group.prototype.update.apply(this, arguments);
};

PickupSpawner.prototype._spawnPickup = function (colorName) {
    var color = colors[colorName];
    var point = this._getSpawnPoint();
    new LightPickup(this.game, point.x, point.y, this, color);
};

PickupSpawner.prototype._getSpawnPoint = function () {
    var map = this.game.globals.tileMap;
    var player = this.game.globals.player;
    var attempts = 0;
    var maxAttempts = 1000;
    while ((attempts < maxAttempts)) {
        attempts++;
        // Pick a tile x & y position that is not along the very edge
        var x = this.game.rnd.integerInRange(1, map.width - 2);
        var y = this.game.rnd.integerInRange(1, map.height - 2);
        // Calculate the pixel position and check that it doesn't overlap player
        var p = new Phaser.Point(x * map.tileWidth, y * map.tileWidth);
        if (p.distance(player.position) <= 30) continue;
        if (this._isTileEmpty(x, y)) return p;
    }
    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
};

PickupSpawner.prototype._isTileEmpty = function (x, y) {
    var map = this.game.globals.tileMap;
    var checkTile = map.getTile(x, y, 
        this.game.globals.tileMapLayer, true);
    // Check if location was out of bounds or invalid (getTileWorldXY returns 
    // null for invalid locations when nonNull param is true)
    if (checkTile === null) return false;
    // Check if tile is empty (getTileWorldXY returns a tile with an index of 
    // -1 when the nonNull param is true)
    if (checkTile.index === -1) return true;
    else return false;
}