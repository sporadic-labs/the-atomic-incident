import Bar from "./bar";

/** HUD element for Dash ability.  Show energy available with Bar. */
export default class DashIcon extends Phaser.Group {
  constructor(game, parentGroup, player) {
    super(game, parentGroup, "dash");

    this._dashCooldownBar = new Bar(game, 0, 0, 25, 25, {
      barColor: 0xe2df2b,
      minValue: 0,
      maxValue: 1
    });
    this._dashCooldownBar.setValue(1.0);
    this.add(this._dashCooldownBar);

    this._dashCooldownAnimationActive = false;

    this._dashCooldown = player._movementController._dashCooldown;
    this._dashCooldown.onActivation.add(x => {
      this._dashCooldownBar.setValue(0);
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
