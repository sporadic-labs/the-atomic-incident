import ImageBar from "./image-bar";
import getFontString from "../../fonts/get-font-string";
import WEAPON_TYPES from "../weapons/weapon-types";

const style = {
  font: getFontString("Montserrat", { size: "15px", weight: 800, align: "right" }),
  fill: "#ffffff"
};

// Move to util since this is now used in multiple places:
const scaleTween = (game, scale, initialValue, maxValue, finalValue) => {
  scale.set(initialValue);
  game.tweens.removeFrom(scale);
  game.make
    .tween(scale)
    .to({ y: maxValue }, 100, Phaser.Easing.Bounce.Out)
    .start();
  const xTween = game.make
    .tween(scale)
    .to({ x: maxValue }, 200, Phaser.Easing.Bounce.Out)
    .start();
  xTween.onComplete.addOnce(() => {
    game.make
      .tween(scale)
      .to({ y: finalValue }, 100, Phaser.Easing.Bounce.Out)
      .start();
    game.make
      .tween(scale)
      .to({ x: finalValue }, 200, Phaser.Easing.Bounce.Out)
      .start();
  });
};

/**
 * Ammo HUD group, positioned via "anchor" at (1, 1) so it can be easily placed at the bottom right
 * of the screen.
 */
export default class Ammo extends Phaser.Group {
  constructor(game, parentGroup, player, weaponSpawner) {
    super(game, parentGroup, "ammo");

    this._player = player;

    this._ammoBar = new ImageBar(game, parentGroup, {
      interiorKey: "hud/ammo-bar-interior",
      outlineKey: "hud/ammo-bar-outline"
    });
    this._ammoBar.position.set(-this._ammoBar.width, -this._ammoBar.height);
    this.add(this._ammoBar);

    const w = this._player.weaponManager.getActiveWeapon();

    const ammoOutline = game.add.sprite(this._ammoBar.x - 56, -46, "assets", "hud/ammo-outline");
    this.add(ammoOutline);

    const frame = this.getWeaponFrame(w);
    this._ammoSprite = new Phaser.Sprite(game, 0, 0, "assets", frame);
    this._ammoSprite.anchor.setTo(0.5, 0.5);
    this._ammoSprite.position.setTo(
      ammoOutline.x + ammoOutline.width / 2,
      ammoOutline.y + ammoOutline.height / 2
    );
    this._ammoSprite.scale.setTo(1.2);
    this.add(this._ammoSprite);

    this._nameText = game.make.text(0, 0, w.getName(), style);
    this._nameText.anchor.setTo(1, 1);
    this._nameText.position.setTo(ammoOutline.x - 10, 7);
    this.add(this._nameText);

    this._ammoText = game.make.text(0, 0, "", style);
    this._ammoText.anchor.setTo(1, 1);
    this._ammoText.position.setTo(ammoOutline.x - 10, -12);
    this.add(this._ammoText);

    weaponSpawner.onPickupCollected.add(this.updateWeapon, this);
  }

  update() {
    const w = this._player.weaponManager.getActiveWeapon();
    if (w.isAmmoEmpty()) {
      this._nameText.setText("Empty!");
      this._ammoText.setText("");
      this._ammoBar.setValue(0);
      this._ammoSprite.visible = false;
    } else {
      this._nameText.setText(w.getName());
      this._ammoSprite.visible = true;
      this._ammoText.setText(`${w.getAmmo()} / ${w.getMaxAmmo()}`);
      this._ammoBar.setValue(w.getAmmo() / w.getMaxAmmo());
    }

    super.update();
  }

  updateWeapon() {
    const w = this._player.weaponManager.getActiveWeapon();
    const newFrame = this.getWeaponFrame(w);
    this._ammoSprite.frameName = newFrame;
    scaleTween(this.game, this._ammoSprite.scale, 0.5, 2, 1.5);
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

  destroy(...args) {
    this.game.tweens.removeFrom(this._ammoSprite.scale);
    super.destroy(...args);
  }
}
