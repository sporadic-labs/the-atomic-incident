import WEAPON_TYPES from "./weapon-types";

export default class MountedGun extends Phaser.Sprite {
  constructor(game, x, y, parentGroup, player, type) {
    let mountedGunKey = "";

    const r = game.rnd.integerInRange(0, 255);
    let color;
    switch (type) {
      case WEAPON_TYPES.SCATTERSHOT:
        color = Phaser.Color.getColor(r, 255, 255);
        mountedGunKey = "weapons/dash_60";
        break;
      case WEAPON_TYPES.HOMING_SHOT:
        color = Phaser.Color.getColor(r, 125, 125);
        mountedGunKey = "weapons/dash_60";
        break;
      case WEAPON_TYPES.PIERCING_SHOT:
        color = Phaser.Color.getColor(255, r, 255);
        mountedGunKey = "weapons/dash_60";
        break;
      case WEAPON_TYPES.RAPID_FIRE:
        color = Phaser.Color.getColor(125, r, 125);
        mountedGunKey = "weapons/dash_60";
        break;
      case WEAPON_TYPES.ROCKET_LAUNCHER:
        color = Phaser.Color.getColor(255, 255, r);
        mountedGunKey = "weapons/dash_60";
        break;
      default:
        color = Phaser.Color.getColor(125, 125, r);
        mountedGunKey = "weapons/dash_60";
        break;
    }

    super(game, x, y, "assets", mountedGunKey);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.tint = color;

    // Store ref to player.
    this._player = player;

    // Animations
    // const shootFrames = Phaser.Animation.generateFrameNames(
    //   `${mountedGunKey}_shoot_`,
    //   0,
    //   15,
    //   "",
    //   2
    // );
    // const emptyFrames = Phaser.Animation.generateFrameNames(
    //   `${mountedGunKey}_empty_`,
    //   0,
    //   15,
    //   "",
    //   2
    // );

    // Player Sound fx
    this._hitSound = this.game.globals.soundManager.add("chiptone/player-hit", 0.03);
    this._deathSound = this.game.globals.soundManager.add("chiptone/player-death", 0.03);
  }

  postUpdate(...args) {
    // Update components after the player
    this.position.copyFrom(this._player.position);
    this.rotation = this._player.rotation;
    super.postUpdate(...args);
  }

  destroy(...args) {
    super.destroy(...args);
  }
}
