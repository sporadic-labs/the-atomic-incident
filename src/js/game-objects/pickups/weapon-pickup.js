import LifecycleObjects from "../lifecycle-object";
import PICKUP_EVENTS from "./pickup-events";

const PICKUP_RANGE = 50;

export default class WeaponPickup extends LifecycleObjects {
  constructor(scene, x, y, pickupGroup, player, weaponType, eventEmitter) {
    super(scene);

    this.sprite = scene.add.sprite(x, y, "assets", "pickups/weapon_pickup");
    pickupGroup.add(this.sprite);
    this.sprite.owner = this;

    this.player = player;
    this.type = weaponType;
    this.events = eventEmitter;

    // this._difficultyModifier = this.game.globals.difficultyModifier;
    // this._pickupSound = game.globals.soundManager.add("fx/crate-pickup");

    // TODO: replace with our physics
    scene.physics.world.enable(this.sprite);
    // game.physics.sat.add.gameObject(this).setOffset(-this.width / 2, -this.height / 2);
  }

  getType() {
    return this.weaponType;
  }

  update() {
    const body = this.sprite.body;
    const playerPosition = this.player.getPosition();
    const dist = body.position.distance(playerPosition);

    // TODO: range should be (1 + this._difficultyModifier.getDifficultyFraction()) * PICKUP_RANGE
    const range = PICKUP_RANGE;
    if (dist < range) {
      // Move pickup towards player slowly when far and quickly when close
      const lerpFactor = Phaser.Math.Linear(0.5, 0, dist / range);
      body.position.set(
        // Body anchor defaults to top left, so adjust by the body half size to get the pickup
        // centered over the player
        (1 - lerpFactor) * body.position.x + lerpFactor * (playerPosition.x - body.halfWidth),
        (1 - lerpFactor) * body.position.y + lerpFactor * (playerPosition.y - body.halfHeight)
      );
    }
  }

  pickUp() {
    // this._pickupSound.play();
    // this._player.weaponManager.switchWeapon(this._type);
    this.events.emit(PICKUP_EVENTS.COLLECTED, this);
    this.destroy();
  }

  destroy() {
    this.events.emit(PICKUP_EVENTS.DESTROYED, this);
    this.sprite.destroy();
    super.destroy();
  }
}
