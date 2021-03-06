const PColor = Phaser.Color;

export default class Color {
  static red() {
    return new Color("#FF4136");
  }
  static green() {
    return new Color("#01FF70");
  }
  static yellow() {
    return new Color("#FFDC00");
  }
  static blue() {
    return new Color("#0074D9");
  }
  static purple() {
    return new Color("#F012BE");
  }
  static white() {
    return new Color("#FFFFFF");
  }
  static black() {
    return new Color("#000000");
  }

  /**
   * Static method to parse weird Tiled hex with alpha (#AARRGGBB)
   */
  static fromTiled(hex) {
    hex = hex.slice(1); // Remove #
    if (hex.length === 8) {
      // Assumes #AARRGGBB
      const a = parseInt(hex.slice(0, 2), 16);
      const r = parseInt(hex.slice(2, 4), 16);
      const g = parseInt(hex.slice(4, 6), 16);
      const b = parseInt(hex.slice(6, 8), 16);
      return new Color(r, g, b, a);
    } else {
      // Assumes #RRGGBB
      const r = parseInt(hex.slice(0, 2), 16);
      const g = parseInt(hex.slice(2, 4), 16);
      const b = parseInt(hex.slice(4, 6), 16);
      return new Color(r, g, b);
    }
  }

  /**
   * Light-weight RGBA color class based on Phaser.Color utils. Channels are in
   * the range 0 - 255.
   *
   * @param {r,g,b,a|integer color|hex color string|CSS color string} arguments If
   * 3 or more arguments are passed, they are interpreted as: r, g, b, a. If 1
   * argument is passed, it is interpreted as an int, hex or css color
   * representation.
   */
  constructor(color) {
    if (arguments.length >= 3) {
      this.r = arguments[0] || 0;
      this.g = arguments[1] || 0;
      this.b = arguments[2] || 0;
      this.a = arguments[3] !== undefined ? arguments[3] : 255;
    } else {
      const colorObject = PColor.valueToColor(color);
      this.r = colorObject.r;
      this.g = colorObject.g;
      this.b = colorObject.b;
      this.a = colorObject.a * 255;
    }
  }

  /**
   * Sets the color channels specified by the r, g, b and a keys of the given
   * argument.
   * @param {object} colorObject An object with r, g, b, a keys in range 0 - 255
   * @returns {this} For chaining
   */
  setTo(colorObject) {
    if (colorObject.r !== undefined) this.r = colorObject.r;
    if (colorObject.g !== undefined) this.g = colorObject.g;
    if (colorObject.b !== undefined) this.b = colorObject.b;
    if (colorObject.a !== undefined) this.a = colorObject.a;
    return this;
  }

  /**
   * Get a 32-bit integer representation of the color which includes alpha
   * @returns {Number} 32-bit integer, e.g. 0xFF00FFFF
   */
  getRgbaColorInt() {
    return PColor.getColor32(this.a, this.r, this.g, this.b);
  }

  /**
   * Get a 24-bit integer representation of the color which excludes alpha
   * @returns {Number} 24-bit integer, e.g. 0xFF00FF
   */
  getRgbColorInt() {
    return PColor.getColor(this.r, this.g, this.b);
  }

  /**
   * Get an RGBA CSS string of the color
   * @returns {String} RGBA CSS String "rgba(0, 0, 255, 1)"
   */
  getWebColor() {
    return PColor.getWebRGB(this);
  }

  /**
   * Return deep copy of the color
   * @returns {Color}
   */
  clone() {
    return new Color(this.r, this.g, this.b, this.a);
  }

  /**
   * Do the RGBA values of the color param match this color?
   * @returns {boolean}
   */
  rgbaEquals(c) {
    return this.r === c.r && this.g === c.g && this.b === c.b && this.a === c.a;
  }

  /**
   * Do the RGB values of the color param match this color?
   * @returns {boolean}
   */
  rgbEquals(c) {
    return this.r === c.r && this.g === c.g && this.b === c.b;
  }
}
