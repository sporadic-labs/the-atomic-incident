/**
 * Image asset based bar based on loading two image layers - the interior (the bar itself) and an
 * outline that is placed on top. The class supports horizontal bars filling from left to right and
 * vertical bars filling from bottom to top. If width >= height, the bar is assumed to be
 * horizontal.
 */
export default class ImageBar extends Phaser.Group {
  constructor(
    game,
    parentGroup,
    { minValue = 0, maxValue = 1, interiorKey = "", outlineKey = "" } = {}
  ) {
    super(game, parentGroup, "image-bar");

    this.setRange(minValue, maxValue);

    this.interiorImage = game.make.image(0, 0, "assets", interiorKey);
    this.outlineImage = game.make.image(0, 0, "assets", outlineKey);

    this.add(this.interiorImage);
    this.add(this.outlineImage);

    this.isHorizontal = this.interiorImage.width >= this.interiorImage.height;

    this.maxCropSize = this.isHorizontal ? this.interiorImage.width : this.interiorImage.height;
    this.cropRect = new Phaser.Rectangle(0, 0, this.interiorImage.width, this.interiorImage.height);

    this.setValue(maxValue);
  }

  setRange(min, max) {
    this.minValue = min;
    this.maxValue = max;
    return this;
  }

  setValue(value) {
    this.value = Phaser.Math.clamp(value, this.minValue, this.maxValue);
    this.updateGraphics();
    return this;
  }

  getValue(value) {
    return value;
  }

  updateGraphics() {
    const cropSize = Phaser.Math.mapLinear(
      this.value,
      this.minValue,
      this.maxValue,
      0,
      this.maxCropSize
    );

    if (this.isHorizontal) {
      this.cropRect.width = cropSize;
    } else {
      // The image placement needs to be adjusted too:
      // See http://phaser.io/examples/v2/sprites/dynamic-crop
      this.cropRect.y = this.maxCropSize - cropSize;
      this.cropRect.height = cropSize;
      this.interiorImage.y = this.maxCropSize - cropSize;
    }

    this.interiorImage.crop(this.cropRect);

    return this;
  }
}
