module.exports = PickupSpawner;

var colors = require("../../constants/colors.js");
var LightPickup = require("./light-pickup.js");

PickupSpawner.prototype = Object.create(Phaser.Group.prototype);

function PickupSpawner(game) {
    var pickupGroup = game.globals.groups.pickups;
    Phaser.Group.call(this, game, pickupGroup, "pickup-spawner");


    this._map = this.game.globals.tileMap;

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Spawn after the lighting system has had a chance to update once
    this._timer.add(0, this._spawnPickup.bind(this));
}

PickupSpawner.prototype._spawnPickup = function () {
    var colorName = this.game.rnd.pick(["red", "blue", "green"]);
    var color = colors[colorName];
    var point = this._getSpawnPoint();
    new LightPickup(this.game, point.x, point.y, this, color);
    var rndDelay = (this.game.rnd.integerInRange(-5, 5) * 20) + 5000;
    this._timer.add(rndDelay, this._spawnPickup.bind(this));
};

PickupSpawner.prototype._getSpawnPoint = function () {
    var attempts = 0;
    var maxAttempts = 1000;
    while ((attempts < maxAttempts)) {
        attempts++;
        var x = this.game.rnd.integerInRange(0, this.game.width);
        var y = this.game.rnd.integerInRange(0, this.game.height);
        var p = new Phaser.Point(x, y);
        if (this._isTileEmpty(x, y)) return p;
    }
    if (attempts >= maxAttempts) {
        console.warn("Not enough places found to spawn enemies.");
    }
};

PickupSpawner.prototype.destroy = function () {
    this._timer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};

PickupSpawner.prototype._isTileEmpty = function (x, y) {
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