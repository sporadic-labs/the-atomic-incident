import WEAPON_TYPES from "../weapons/weapon-types";
import { shuffleArray } from "../../helpers/utilities";

export default class PickupSpawner extends Phaser.Group {
  constructor(game, parent, player, levelManager) {
    super(game, parent, "pickup-spawner");
    this._spawnLocations = levelManager.getPickupLocations();
    this._player = player;

    this.onPickupCollected = new Phaser.Signal();
    this.onPickupSpawned = new Phaser.Signal();
    this.onPickupDestroyed = new Phaser.Signal();
  }

  spawnPickup(type) {
    const point = this._getSpawnPoint(this._spawnLocations);
    const pickup = new WeaponPickup(this.game, point.x, point.y, this._player, type, this);
    this.add(pickup);
    this.onPickupSpawned.dispatch(pickup);
  }

  update() {
    if (this.children.length === 0) {
      const activeType = this._player.weaponManager.getActiveType();
      const possibleTypes = Object.values(WEAPON_TYPES).filter(t => t !== activeType);
      const type = this.game.rnd.pick(possibleTypes);
      this.spawnPickup(type);
    }
  }

  destroy(...args) {
    this.onPickupSpawned.dispose();
    this.onPickupCollected.dispose();
    this.onPickupDestroyed.dispose();
    super.destroy(...args);
  }

  /**
   * Returns an empty, valid spawn point, or null if none found
   * 
   * @returns {Phaser.Point|null}
   * @memberof PickupSpawner
   */
  _getSpawnPoint() {
    const possiblePoints = shuffleArray(this._spawnLocations.slice());
    for (const point of possiblePoints) {
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
    return null;
  }
}

class WeaponPickup extends Phaser.Sprite {
  constructor(game, x, y, player, type, pickupSpawner) {
    super(game, x, y, "assets", "pickups/box");
    this.anchor.set(0.5);

    this._player = player;
    this._type = type;
    this._onPickupCollected = pickupSpawner.onPickupCollected;
    this._onPickupDestroyed = pickupSpawner.onPickupDestroyed;

    this._pickupSound = game.globals.soundManager.add("crate-pickup");

    game.physics.arcade.enable(this);
    this.satBody = game.globals.plugins.satBody.addBoxBody(this);
  }

  pickUp() {
    this._pickupSound.play();
    this._player.weaponManager.switchWeapon(this._type);
    this._onPickupCollected.dispatch(this);
    this.destroy();
  }

  destroy(...args) {
    this._onPickupDestroyed.dispatch(this);
    super.destroy(...args);
  }
}
