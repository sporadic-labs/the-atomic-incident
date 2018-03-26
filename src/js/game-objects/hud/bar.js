const DIRECTIONS = {
  UP: "up",
  DOWN: "down",
  LEFT: "left",
  RIGHT: "right",
  AUTO: "auto"
};

export default class Bar extends Phaser.Graphics {
  static DIRECTIONS = DIRECTIONS;

  constructor(
    game,
    x,
    y,
    width,
    height,
    {
      minValue = 0,
      maxValue = 1,
      borderColor = 0xffffff,
      borderWidth = 3,
      barColor = 0xdf403c,
      fillDirection = DIRECTIONS.AUTO
    } = {}
  ) {
    super(game, x, y);

    this.borderColor = borderColor;
    this.borderWidth = borderWidth;
    this.barColor = barColor;
    this.minValue = minValue;
    this.maxValue = maxValue;
    this.value = maxValue;
    this.barWidth = width;
    this.barHeight = height;

    if (fillDirection === DIRECTIONS.AUTO) {
      fillDirection = this.barWidth >= this.barHeight ? DIRECTIONS.RIGHT : DIRECTIONS.UP;
    }
    this.fillDirection = fillDirection;

    this.redraw();
  }

  setRange(min, max) {
    this.minValue = min;
    this.maxValue = max;
    return this;
  }

  setValue(value) {
    this.value = Phaser.Math.clamp(value, this.minValue, this.maxValue);
    this.redraw();
    return this;
  }

  getValue(value) {
    return value;
  }

  redraw() {
    const fraction = (this.value - this.minValue) / (this.maxValue - this.minValue);

    this.clear();

    this.beginFill(this.barColor);
    switch (this.fillDirection) {
      case DIRECTIONS.RIGHT: {
        this.drawRect(0, 0, this.barWidth * fraction, this.barHeight);
        break;
      }
      case DIRECTIONS.LEFT: {
        this.drawRect(this.barWidth * fraction, 0, this.barWidth, this.barHeight);
        break;
      }
      case DIRECTIONS.UP: {
        this.drawRect(0, this.barHeight * (1 - fraction), this.barWidth, this.barHeight * fraction);
        break;
      }
      case DIRECTIONS.DOWN: {
        this.drawRect(0, 0, this.barWidth, this.barHeight * fraction);
        break;
      }
    }
    this.endFill();

    this.lineStyle(this.borderWidth, this.borderColor, 1);
    this.drawRect(0, 0, this.barWidth, this.barHeight);

    return this;
  }
}
