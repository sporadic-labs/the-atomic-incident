export default class EnergyPickup extends Phaser.Sprite {
  constructor(game, x, y, parentGroup, energyValue, durationSeconds = 10) {
    super(game, x, y, "assets", "pickups/energy-pickup");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._energyValue = energyValue;
    this._durationMs = durationSeconds * 1000;
    this._timer = game.time.create(false);
    this._timer.start();

    this._pickupSound = game.globals.soundManager.add("chiptone/energy-pickup");
    this._pickupSound.playMultiple = true;

    // Configure physics
    game.physics.arcade.enable(this);
    this.satBody = game.globals.plugins.satBody.addBoxBody(this);
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
