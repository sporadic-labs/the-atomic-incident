import LifecycleObjects from "../lifecycle-object";

const PICKUP_RANGE = 50;

export default class EnergyPickup extends LifecycleObjects {
  constructor(scene, x, y, pickupGroup, player, energyValue = 10, durationSeconds = 15) {
    super(scene);

    this.sprite = scene.add.sprite(x, y, "assets", "pickups/energy-pickup");
    pickupGroup.add(this.sprite);
    this.sprite.owner = this;

    this.player = player;
    this.energyValue = energyValue;

    this.tween = scene.tweens.add({
      targets: this.sprite,
      alpha: 0.25,
      ease: "Quad.easeInOut",
      duration: 300,
      loop: 5,
      yoyo: true,
      delay: durationSeconds * 1000,
      onComplete: () => this.destroy()
    });

    // this._difficultyModifier = this.game.globals.difficultyModifier;
    // this._pickupSound = game.globals.soundManager.add("fx/light-powerup");

    // TODO: replace with our physics
    scene.physics.world.enable(this.sprite);
    // game.physics.sat.add.gameObject(this).setCircle(this.width / 2);
  }

  getEnergy() {
    return this.energyValue;
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
    this.destroy();
  }

  destroy() {
    this.tween.stop();
    this.sprite.destroy();
    super.destroy();
  }
}
