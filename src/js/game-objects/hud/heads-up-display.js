/**
 * Player Heads Up Display.
 * Advanced HUD made with bleeding edge nano tech and the most advanced
 * x-ray, sonar, infrared and [REDACTED] for unmatched exploration.
 * Keeps track of Pause/Mute, Score, Ammo, and FPS (debug only!).
 * 
 * @class HeadsUpDisplay
 * @extends {Phaser.Group}
 */
export default class HeadsUpDisplay extends Phaser.Group {
  /**
     * @param {Phaser.Game} game
     * @param {Phaser.Group} parentGroup
     */
  constructor(game, parentGroup) {
    super(game, parentGroup, "heads-up-display");

    this._player = this.game.globals.player;

    // Ammo
    this._ammoText = game.make.text(18, 32, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "left"
    });
    this._ammoText.anchor.setTo(0, 0.5);
    this.add(this._ammoText);
  }

  /**
     * Update lifecycle hook.
     * 
     * @memberof HeadsUpDisplay
     */
  update() {
    if (!this._player.weapon._isReloading) {
      this._ammoText.setText(
        this._player.weapon.getAmmo() + " / " + this._player.weapon._totalAmmo
      );
    } else {
      this._ammoText.setText("Reloading...");
    }
  }

  /**
   * Start the hud reload animation.
   * TODO(rex): Do something better here...
   * 
   * @param {int} duration
   * @memberof HeadsUpDisplay
   */
  startHudReloadAnimation(duration) {
    // Set variables used for the HUD reload animation.
    this._reloadAnimationDuration = duration; // TODO(rex): Default.
    this._reloadAnimationStartTime = Date.now();
    this._playReloadAnimation = true;
  }

  /**
   * Manually updating the mask around the reload text.
   * TODO(rex): This isn't being used right now...
   * 
   * @memberof HeadsUpDisplay
   */
  _hudReloadAnimation() {
    // Get the current time, figure our progress through the animation timer,
    // and update the hud accordingly.
    const currentTime = Date.now();
    const diff = currentTime - this._reloadAnimationStartTime;
    if (diff < this._reloadAnimationDuration) {
      // Update the reload mask.
      const fractionMasked = diff / this._reloadAnimationDuration;
      const cropAmount = fractionMasked * this._ammoText.width;
      this._ammoText.crop(new Phaser.Rectangle(0, 0, cropAmount, this._ammoText.height));
    } else {
      // The animation has ended, reset animation variables.
      this._playReloadAnimation = false;
      this._reloadAnimationStartTime = 0;
      this._reloadAnimationDuration = 0; // TODO(rex): This...?
      this._ammoMask.visible = false;
    }
  }
}
