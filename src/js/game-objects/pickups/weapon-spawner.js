import WEAPON_TYPES from "../weapons/weapon-types";
import { shuffleArray } from "../../helpers/utilities";

const PICKUP_RANGE = 75;

export default class PickupSpawner extends Phaser.Group {
  /**
   * Factory for generating and spawning new Weapon Pickups.
   *
   * @param {Phaser.Game} game
   * @param {Phaser.Group} parent
   * @param {Player} player
   * @param {LevelManager} levelManager
   */
  constructor(game, parent, player, levelManager) {
    super(game, parent, "pickup-spawner");
    this._spawnLocations = levelManager.getPickupLocations();
    this._player = player;

    this.onPickupCollected = new Phaser.Signal();
    this.onPickupSpawned = new Phaser.Signal();
    this.onPickupDestroyed = new Phaser.Signal();

    this.onPickupDestroyed.add(() => {
      const type = this.choosePickupType();
      this.spawnPickup(type);
    });

    /* Choose a random type for the first pickup, and kick things off by spawning one!
     * NOTE(rex): This is a hack to get around a race condition.  The radar is created after
     * the weapon spawner, but creates the goal indicator to show weapon position.
     * The first WeaponPickup is created here, before the radar is created.  SetTimeout
     * will get around this for the moment, but we probably should organize the code better instead!
     */
    setTimeout(() => {
      const type = this.choosePickupType();
      this.spawnPickup(type);
    }, 0);
  }

  /**
   * Choose a random pickup type that the player isn't using.
   */
  choosePickupType() {
    const activeType = this._player.weaponManager.getActiveType();
    const possibleTypes = Object.values(WEAPON_TYPES).filter(t => t !== activeType);
    return this.game.rnd.pick(possibleTypes);
  }

  /**
   *
   * @param {WEAPON_TYPES} type - Weapon type this pickup will
   */
  spawnPickup(type) {
    const point = this._getSpawnPoint(this._spawnLocations);
    const pickup = new WeaponPickup(this.game, point.x, point.y, this._player, type, this);
    this.add(pickup);
    this.onPickupSpawned.dispatch(pickup);
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
      if (point.distance(this._player.position) <= 200) continue;

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
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._pickupSound = game.globals.soundManager.add("crate-pickup");

    game.physics.sat.add.gameObject(this).setOffset(-this.width / 2, -this.height / 2);
  }

  getType() {
    return this._type;
  }

  update() {
    const dist = this.body.position.distance(this._player.position);
    const range = (1 + this._difficultyModifier.getDifficultyFraction()) * PICKUP_RANGE;
    if (this.body.position.distance(this._player.position) < range) {
      // Move pickup towards player slowly when far and quickly when close
      const lerpFactor = Phaser.Math.mapLinear(dist / range, 0, 1, 0.2, 0);
      this.body.setPosition(
        (1 - lerpFactor) * this.body.position.x + lerpFactor * this._player.position.x,
        (1 - lerpFactor) * this.body.position.y + lerpFactor * this._player.position.y
      );
    }
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
