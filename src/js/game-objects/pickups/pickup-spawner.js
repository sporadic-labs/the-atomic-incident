import EnergyPickup from "./energy-pickup";

export default class PickupSpawner extends Phaser.Group {
  constructor(game) {
    super(game, game.globals.groups.pickups, "pickup-spawner");
    this._spawnLocations = this._findSpawnLocations(game.globals.mapManager.tilemap);
    this._player = game.globals.player;
  }

  spawnPickup(colorName, amount = 1) {
    for (let i = 0; i < amount; i++) {
      const point = this._getSpawnPoint(this._spawnLocations);
      new EnergyPickup(this.game, point.x, point.y, this, 100, 3);
    }
  }

  _findSpawnLocations(tilemap) {
    const spawnLocations = [];
    const pickups = tilemap.objects["pickups"] || [];
    pickups.map(pickup => {
      // Rectangle center
      spawnLocations.push(
        new Phaser.Point(pickup.x + pickup.width / 2, pickup.y + pickup.height / 2)
      );
    });
    return spawnLocations;
  }

  _getSpawnPoint(spawnPoints, maxAttempts = 100) {
    let numAttempts = 0;
    while (numAttempts < maxAttempts) {
      numAttempts++;
      const point = this.game.rnd.pick(spawnPoints);
      // Make sure pickup is not underneath player
      if (point.distance(this._player.position) <= 30) continue;
      // Make sure pick is not underneath an existing pickup
      let overlapExisting = false;
      for (const pickup of this.children) {
        if (point.distance(pickup.position) <= 30) {
          overlapExisting = true;
          break;
        }
      }
      if (overlapExisting) continue;
      return point; // Valid point found
    }
    console.warn("Not enough places found to spawn pickups.");
  }
}
