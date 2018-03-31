import Bar from "./bar";
import getFontString from "../../fonts/get-font-string";
import WEAPON_TYPES from "../weapons/weapon-types";

const style = {
  font: getFontString("Montserrat", { size: "15px", weight: 300 }),
  fill: "#ffffff"
};
const centeredStyle = Object.assign({}, style, { align: "center" });
const rightAlignedStyle = Object.assign({}, style, { align: "right" });

/**
 * Ammo HUD group, positioned via "anchor" at (1, 1) so it can be easily placed at the bottom right
 * of the screen.
 */
export default class Ammo extends Phaser.Group {
  constructor(game, parentGroup, player, weaponSpawner) {
    super(game, parentGroup, "ammo");

    this._player = player;

    this._ammoBar = new Bar(game, 0, 0, 20, 115, { barColor: 0xf48337, minValue: 0, maxValue: 1 });
    this._ammoBar.position.setTo(-this._ammoBar.width, -this._ammoBar.height);
    this.add(this._ammoBar);

    const w = this._player.weaponManager.getActiveWeapon();

    this._ammoText = game.make.text(0, 0, "", rightAlignedStyle);
    this._ammoText.anchor.setTo(1, 1);
    this._ammoText.position.setTo(this._ammoBar.x - 30, -60);
    this.add(this._ammoText);

    const frame = this.getWeaponFrame(w);
    this._ammoSprite = new Phaser.Sprite(game, 0, 0, "assets", frame);
    this._ammoSprite.anchor.setTo(1, 1);
    this._ammoSprite.position.setTo(this._ammoBar.x - 30, -28);
    this._ammoSprite.scale.setTo(2);
    this.add(this._ammoSprite);

    this._nameText = game.make.text(0, 0, w.getName(), rightAlignedStyle);
    this._nameText.anchor.setTo(1, 1);
    this._nameText.position.setTo(this._ammoBar.x - 30, 0);
    this.add(this._nameText);

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
    const newFrame = this.getWeaponFrame(w);
    this._ammoSprite.frameName = newFrame;
    this._nameText.setText(w.getName());
  }

  getWeaponFrame(weapon) {
    let frame;

    switch (weapon.getType()) {
      case WEAPON_TYPES.BOUNCING:
        frame = "weapons/bouncing";
        break;
      case WEAPON_TYPES.PIERCING_SHOT:
        frame = "weapons/machine_gun_15";
        break;
      case WEAPON_TYPES.FLAMETHROWER:
        frame = "weapons/flame";
        break;
      case WEAPON_TYPES.RAPID_FIRE:
        frame = "weapons/slug";
        break;
      case WEAPON_TYPES.SCATTERSHOT:
        frame = "weapons/shotgun_15";
        break;
      case WEAPON_TYPES.ROCKET_LAUNCHER:
        frame = "weapons/rocket_15";
        break;
      case WEAPON_TYPES.HOMING_SHOT:
        frame = "weapons/tracking_15";
        break;
      default:
        console.error("invalid weapon type!");
        break;
    }

    return frame;
  }
}
