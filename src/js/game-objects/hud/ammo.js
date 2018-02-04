import Bar from "./bar";
import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "15px", weight: 300 }),
  fill: "#ffffff"
};
const centeredStyle = Object.assign({}, style, { align: "center" });

/**
 * Ammo HUD group, positioned via "anchor" at (1, 1) so it can be easily placed at the bottom right
 * of the screen.
 */
export default class Ammo extends Phaser.Group {
  constructor(game, parentGroup, player, weaponSpawner) {
    super(game, parentGroup, "ammo");

    this._player = player;

    this._ammoBar = new Bar(game, 0, 0, 20, 115, { barColor: 0xdf403c, minValue: 0, maxValue: 1 });
    this._ammoBar.position.setTo(-this._ammoBar.width, -this._ammoBar.height);
    this.add(this._ammoBar);

    const w = this._player.weaponManager.getActiveWeapon();
    this._nameText = game.make.text(0, 0, `(insert image)\n${w.getName()}`, centeredStyle);
    this._nameText.anchor.setTo(1, 1);
    this._nameText.position.setTo(this._ammoBar.x - 20, 0);
    this.add(this._nameText);

    this._ammoText = game.make.text(0, 0, "", style);
    this._ammoText.anchor.setTo(1, 1);
    this._ammoText.position.setTo(this._ammoBar.x - 40, -45);
    this.add(this._ammoText);

    weaponSpawner.onPickupCollected.add(this.updateWeapon, this);
  }

  update() {
    const w = this._player.weaponManager.getActiveWeapon();
    this._ammoText.setText(w.isReloading() ? `Reloading...` : `${w.getAmmo()} / ${w.getMaxAmmo()}`);
    this._ammoBar.setValue(w.getAmmo() / w.getMaxAmmo());
    super.update();
  }

  updateWeapon() {
    const w = this._player.weaponManager.getActiveWeapon();
    this._nameText.setText(`(insert image)\n${w.getName()}`);
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
