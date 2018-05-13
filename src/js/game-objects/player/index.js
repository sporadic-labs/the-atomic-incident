import LifeCycleObject from "../lifecycle-object";
import MovementController from "./movement-controller";
import SmokeTrail from "./smoke-trail";
import EnergyPickup from "../pickups/energy-pickup";

const ANIM = {
  HIT: "PLAYER_HIT",
  MOVE: "PLAYER_MOVE",
  DIE: "PLAYER_DIE"
};

export default class Player extends LifeCycleObject {
  constructor(scene, x, y, pickups) {
    super(scene);

    this.sprite = scene.add.sprite(x, y, "assets", "player/move");

    scene.anims.create({
      key: ANIM.HIT,
      frames: scene.anims.generateFrameNames("assets", {
        prefix: "player/hit-flash_",
        end: 32,
        zeroPad: 2
      }),
      frameRate: 30
    });
    scene.anims.create({
      key: ANIM.DIE,
      frames: scene.anims.generateFrameNames("assets", {
        prefix: "player/death_",
        end: 15,
        zeroPad: 2
      }),
      frameRate: 30
    });

    // Test code: saving for when we need to register when an animation is done
    // this.sprite.on("animationcomplete", currentAnim => {
    //  if (currentAnim.key === ANIM.DIE) // Do stuff
    // });

    scene.physics.world.enable(this.sprite);

    // Unsatisfying overlap where you are locked into overlapping Phaser GOs - make sure our physics
    // has body vs body
    scene.physics.world.addOverlap(this.sprite, pickups, (_, pickup) =>
      this.onCollideWithPickup(pickup.owner)
    );

    this.movementController = new MovementController(this, this.sprite.body, scene);

    this.trail = new SmokeTrail(scene, this.sprite);
  }

  onCollideWithPickup(pickup) {
    // TODO
    if (pickup instanceof EnergyPickup) {
      // this._playerLight.incrementRadius(pickup.getEnergy());
      // this.onHealthChange.dispatch(this.getHealth());
    }
    pickup.pickUp();
  }

  /**
   * Returns the position of the center of the player.
   *
   * @returns Phaser.Math.Vector2
   * @memberof Player
   */
  getPosition() {
    return this.sprite.body.center;
  }

  update(time, delta) {
    this.movementController.update(time, delta);
    this.trail.update(time, delta);

    const speed = this.sprite.body.velocity.length();
    const engineStrength = speed > 1000 ? 1 : speed / 1000;
    this.trail.setStrength(engineStrength);
  }

  destroy() {
    this.sprite.destroy();
    this.movementController.destroy();
    this.trail.destroy();
    super.destroy();
  }
}
