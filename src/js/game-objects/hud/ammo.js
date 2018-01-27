const style = {
  font: "24px 'Alfa Slab One'",
  fill: "#ffd800"
};
export default class Ammo extends Phaser.Group {
  constructor(game, parentGroup, player, weaponSpawner) {
    super(game, parentGroup, "ammo");

    this._player = player;

    const w = this._player.weaponManager.getActiveWeapon();
    this._nameText = game.make.text(0, 0, w.getName(), style);
    this._nameText.anchor.setTo(0, 0);
    this.add(this._nameText);

    this._ammoText = game.make.text(0, 32, "", style);
    this._ammoText.anchor.setTo(0, 0);
    this.add(this._ammoText);

    weaponSpawner.onPickupCollected.add(this.updateWeapon, this);
  }

  update() {
    const w = this._player.weaponManager.getActiveWeapon();
    this._ammoText.setText(w.isReloading() ? `Reloading...` : `${w.getAmmo()} / ${w.getMaxAmmo()}`);
    super.update();
  }

  updateWeapon() {
    const w = this._player.weaponManager.getActiveWeapon();
    this._nameText.setText(w.getName());
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
