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
}
