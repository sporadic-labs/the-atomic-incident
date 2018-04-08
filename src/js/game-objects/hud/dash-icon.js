import ImageBar from "./image-bar";

/** HUD element for Dash ability.  Show energy available with Bar. */
export default class DashIcon extends Phaser.Group {
  constructor(game, parentGroup, player) {
    super(game, parentGroup, "dash");

    this._icon = game.make.sprite(0, 0, "assets", "hud/dash-icon", parentGroup);
    this.add(this._icon);

    this._dashCooldownBar = new ImageBar(game, parentGroup, {
      x: 45,
      y: 47,
      interiorKey: "hud/dash-bar-interior",
      outlineKey: "hud/dash-bar-outline"
    });

    this._dashCooldownAnimationActive = false;

    this._dashCooldown = player._movementController._dashCooldown;
    this._dashCooldown.onActivation.add(x => {
      this._dashCooldownBar.setValue(0, 0);
    });

    this._dashCooldown.onDeactivation.add(x => {
      this._dashCooldownAnimationActive = true;
    });

    this._dashCooldown.onReady.add(x => {
      this._dashCooldownBar.setValue(1.0);
      this._dashCooldownAnimationActive = false;
    });
  }

  update() {
    if (this._dashCooldownAnimationActive) {
      this._dashCooldownBar.setValue(this._dashCooldown.getCooldownProgress());
    }
    super.update();
  }
}
