var colors = require("../../constants/colors.js");
var LightPickup = require("./light-pickup.js");

class PickupSpawner extends Phaser.Group {
    constructor(game) {
        var pickupGroup = game.globals.groups.pickups;
        super(game, pickupGroup, "pickup-spawner");
        this._map = this.game.globals.tileMap;
        this._spawnLocations = this._getSpawnLocations();
    }

    _getSpawnLocations() {
        const pickups = this._map.objects["pickups"] || [];
        const points = [];
        for (var i = 0; i < pickups.length; i++) {
            // Rectangle center
            points.push(new Phaser.Point(
                pickups[i].x + pickups[i].width / 2, 
                pickups[i].y + pickups[i].height / 2
            ));
        }
        return points;
    }

    update() {
        if (this.children.length === 0) {
            this._spawnPickup("red");
            this._spawnPickup("blue");
            this._spawnPickup("green");
        }
        super.update(...arguments);
    }

    _spawnPickup(colorName) {
        var color = colors[colorName];
        var point = this._getSpawnPoint();
        new LightPickup(this.game, point.x, point.y, this, color);
    }

    _getSpawnPoint() {
        var player = this.game.globals.player;
        let attempts = 0; 
        while ((attempts < 100)) {
            attempts++;
            const point = this.game.rnd.pick(this._spawnLocations);
            // Make sure pickup is not underneath player
            if (point.distance(player.position) <= 30) continue;
            // Make sure pick is not underneath an existing pickup
            let overlapExisting = false;
            for (const pickup of this.children) {
                if (point.distance(pickup.position) <= 30) {
                    overlapExisting = true;
                    break;
                }
            }
            if (overlapExisting) continue;
            // Valid point found
            return point;
        }
        console.warn("Not enough places found to spawn pickups.");
    }

    _isTileEmpty(x, y) {
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
}

module.exports = PickupSpawner;