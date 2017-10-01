export default class Ammo extends Phaser.Group {
  constructor(game, parentGroup, player) {
    super(game, parentGroup, "ammo");

    this._player = player;

    this._ammoText = game.make.text(0, 0, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#ffd800"
    });
    this._ammoText.anchor.setTo(0, 0);
    this.add(this._ammoText);
  }

  update() {
    const weapon = this._player.weaponManager.getActiveWeapon();
    if (!weapon._isReloading) {
      this._ammoText.setText(weapon.getAmmo() + " / " + weapon._totalAmmo);
    } else {
      this._ammoText.setText("Reloading...");
    }
    super.update();
  }

  // /**
  //  * Start the hud reload animation.
  //  * TODO(rex): Do something better here...
  //  *
  //  * @param {int} duration
  //  * @memberof HeadsUpDisplay
  //  */
  // startHudReloadAnimation(duration) {
  //   // Set variables used for the HUD reload animation.
  //   this._reloadAnimationDuration = duration; // TODO(rex): Default.
  //   this._reloadAnimationStartTime = Date.now();
  //   this._playReloadAnimation = true;
  // }

  // /**
  //  * Manually updating the mask around the reload text.
  //  * TODO(rex): This isn't being used right now...
  //  *
  //  * @memberof HeadsUpDisplay
  //  */
  // _hudReloadAnimation() {
  //   // Get the current time, figure our progress through the animation timer,
  //   // and update the hud accordingly.
  //   const currentTime = Date.now();
  //   const diff = currentTime - this._reloadAnimationStartTime;
  //   if (diff < this._reloadAnimationDuration) {
  //     // Update the reload mask.
  //     const fractionMasked = diff / this._reloadAnimationDuration;
  //     const cropAmount = fractionMasked * this._ammoText.width;
  //     this._ammoText.crop(new Phaser.Rectangle(0, 0, cropAmount, this._ammoText.height));
  //   } else {
  //     // The animation has ended, reset animation variables.
  //     this._playReloadAnimation = false;
  //     this._reloadAnimationStartTime = 0;
  //     this._reloadAnimationDuration = 0; // TODO(rex): This...?
  //     this._ammoMask.visible = false;
  //   }
  // }
}
