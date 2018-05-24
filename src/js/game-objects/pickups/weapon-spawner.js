import Phaser from "phaser";
import { WEAPON_TYPES } from "../weapons/";
import WeaponPickup from "./weapon-pickup";
import PICKUP_EVENTS from "./pickup-events";

const PICKUP_RANGE = 75;

export default class WeaponSpawner {
  constructor(scene, pickupGroup, player, pickupLocations) {
    this.scene = scene;
    this.pickupGroup = pickupGroup;
    this.player = player;
    this.pickupLocations = pickupLocations;

    this.events = new Phaser.Events.EventEmitter();

    this.events.on(PICKUP_EVENTS.DESTROYED, () => this.spawnPickup());

    // /* Choose a random type for the first pickup, and kick things off by spawning one!
    //  * NOTE(rex): This is a hack to get around a race condition.  The radar is created after
    //  * the weapon spawner, but creates the goal indicator to show weapon position.
    //  * The first WeaponPickup is created here, before the radar is created.  SetTimeout
    //  * will get around this for the moment, but we probably should organize the code better instead!
    //  */
    // setTimeout(() => {
    //   const type = this.choosePickupType();
    //   this.spawnPickup(type);
    // }, 0);
    this.spawnPickup();
  }

  /**
   * Spawns a pickup at a random location, if any valid ones are available. If no weapon type is
   * specified, a random type is chosen, excluding the player's current weapon.
   *
   * @param {string} type
   * @memberof WeaponSpawner
   */
  spawnPickup(type) {
    if (!type) {
      // const activeType = this._player.weaponManager.getActiveType();
      // const possibleTypes = Object.values(WEAPON_TYPES).filter(t => t !== activeType);
      const possibleTypes = Object.values(WEAPON_TYPES);
      type = Phaser.Utils.Array.GetRandom(possibleTypes);
    }

    const point = this.getSpawnPoint();
    if (point) {
      const pickup = new WeaponPickup(
        this.scene,
        point.x,
        point.y,
        this.pickupGroup,
        this.player,
        type,
        this.events
      );

      this.events.emit(PICKUP_EVENTS.SPAWNED, pickup);
    }
  }

  destroy() {
    this.events.destroy();
  }

  getSpawnPoint() {
    const possiblePoints = Phaser.Utils.Array.Shuffle(this.pickupLocations);
    for (const point of possiblePoints) {
      // Make sure pickup is not underneath player
      if (point.distance(this.player.getPosition()) <= 200) continue;
      return point;
    }
    return null;
  }
}
