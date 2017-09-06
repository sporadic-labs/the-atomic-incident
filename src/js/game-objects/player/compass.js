import Color from "../../helpers/color";

export default class Compass extends Phaser.Image {
  constructor(game, parent, radius, offset = Math.PI / 2) {
    super(game, 0, 0, "assets", "hud/targeting-arrow");

    this.scale.setTo(0.56, 0.56);
    this.tint = Color.black().getRgbColorInt();
    this.anchor.set(0.5);
    parent.add(this);

    this._radius = radius;
    this._offset = offset;
  }

  repositionAt(center, angle) {
    this.position.x = center.x + this._radius * Math.cos(angle - this._offset);
    this.position.y = center.y + this._radius * Math.sin(angle - this._offset);
    this.rotation = angle;
  }
}
