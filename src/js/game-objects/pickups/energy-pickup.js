const PICKUP_RANGE = 50;

export default class EnergyPickup extends Phaser.Sprite {
  constructor(game, x, y, parentGroup, player, energyValue = 10, durationSeconds = 15) {
    super(game, x, y, "assets", "pickups/energy-pickup");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._difficultyModifier = this.game.globals.difficultyModifier;
    this._player = player;
    this._energyValue = energyValue;
    this._durationMs = durationSeconds * 1000;
    this._timer = game.time.create(false);
    this._timer.start();

    this._pickupSound = game.globals.soundManager.add("light-powerup");

    // Configure physics
    game.physics.sat.add.gameObject(this).setCircle(this.width / 2);
  }

  getEnergy() {
    return this._energyValue;
  }

  update() {
    // If pickup time has expired, set up a tween to begin blinking before destroying pickup
    if (this._durationMs - this._timer.ms < 0 && !this._tween) {
      this._tween = this.game.make
        .tween(this)
        .to({ alpha: 0.25 }, 300, "Quad.easeInOut", true, 0, 5, true);
      this._tween.onComplete.add(() => this.destroy());
    }

    const dist = this.body.position.distance(this._player.position);
    const range = (1 + this._difficultyModifier.getDifficultyFraction()) * PICKUP_RANGE;
    if (this.body.position.distance(this._player.position) < range) {
      // Move pickup towards player slowly when far and quickly when close
      const lerpFactor = Phaser.Math.mapLinear(dist / range, 0, 1, 0.5, 0);
      this.body.setPosition(
        (1 - lerpFactor) * this.body.position.x + lerpFactor * this._player.position.x,
        (1 - lerpFactor) * this.body.position.y + lerpFactor * this._player.position.y
      );
    }
  }

  pickUp() {
    this._pickupSound.play();
    this.destroy();
  }

  destroy(...args) {
    this._timer.destroy();
    if (this._tween) this._tween.manager.remove(this._tween);
    super.destroy(...args);
  }
}
