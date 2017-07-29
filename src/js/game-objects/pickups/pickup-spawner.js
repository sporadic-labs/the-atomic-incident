var colors = require("../../constants/colors.js");
const LightPickup = require("./light-pickup.js");
const AbilityPickup = require("./ability-pickup.js");
const abilities = require("../../constants/ability-names.js");

import EnergyPickup from "./energy-pickup";

class PickupSpawner extends Phaser.Group {
    constructor(game) {
        super(game, game.globals.groups.pickups, "pickup-spawner");
        this._findSpawnLocations();

        this._levelManager = game.globals.levelManager;
        this._levelManager.levelChangeSignal.add(this._findSpawnLocations, this);
    }

    spawnPickup(colorName, amount = 1) {
        for (let i = 0; i < amount; i++) {
            const color = colors[colorName];
            const point = this._getSpawnPoint();
            // new LightPickup(this.game, point.x, point.y, this, color);
            new EnergyPickup(this.game, point.x, point.y, this, 100, 3);
        }
    }

    destroy() {
        this._levelManager.levelChangeSignal.remove(this._findSpawnLocations, this);
        super.destroy(...arguments);
    }

    _findSpawnLocations() {
        this._spawnLocations = [];
        const map = this.game.globals.levelManager.getCurrentTilemap();
        const pickups = map.objects["pickups"] || [];
        for (var i = 0; i < pickups.length; i++) {
            // Rectangle center
            this._spawnLocations.push(new Phaser.Point(
                pickups[i].x + pickups[i].width / 2,
                pickups[i].y + pickups[i].height / 2
            ));
        }
    }

    _spawnAbilityPickup() {
        const point = this._getSpawnPoint();
        const name = this.game.rnd.pick([abilities.DASH, abilities.SLOW_MOTION, abilities.GHOST]);
        new AbilityPickup(this.game, point.x, point.y, this, name);
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
        const map = this._levelManager.getCurrentTilemap();
        const wallLayer = this._levelManager.getCurrentWallLayer();
        var checkTile = map.getTile(x, y, wallLayer, true);
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