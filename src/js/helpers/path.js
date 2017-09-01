/**
 * A class for representing a series of line segments. It can be used to ask for
 * a position some distance along the path. Most methods return "this" for 
 * chaining purposes.
 * 
 * @class Path
 */
class Path {
  /**
     * Creates an instance of Path.
     * @param {Phaser.Point[]} [points=[]] An array of Phaser.Points
     * 
     * @memberOf Path
     */
  constructor(points = []) {
    this._points = points;
    this._calculateSegmentLengths();
  }

  _calculateSegmentLengths() {
    this._segmentLengths = [];
    let lastPoint = this._points[0];
    for (let i = 1; i < this._points.length; i++) {
      const length = lastPoint.distance(this._points[i]);
      this._segmentLengths.push(length);
      lastPoint = this._points[i];
    }
  }

  /**
     * Adds any number of Phaser.Point objects to the path
     * 
     * @param {...Phaser.Point} points Any number of Phaser.Points 
     * @returns {this}
     * 
     * @memberOf Path
     */
  addPoint(...points) {
    this._points.push(...points);
    this._calculateSegmentLengths();
    return this;
  }

  /**
     * Calculates the total length of the path
     * 
     * @returns {number}
     * 
     * @memberOf Path
     */
  getLength() {
    return this._segmentLengths.reduce((sum, length) => sum + length);
  }

  isEmpty() {
    return this._points.length === 0;
  }

  /**
     * Gets the point along the path at the given fraction of the total length.
     * 
     * @param {number} fraction A number between 0 and 1
     * @returns {Phaser.Point}
     * 
     * @memberOf Path
     */
  getPointAtFraction(fraction) {
    return this.getPointAtLength(fraction * this.getLength());
  }

  /**
     * Gets the point along the path at the given length.
     * 
     * @param {number} length Length along the path
     * @returns {Phaser.Point}
     * 
     * @memberOf Path
     */
  getPointAtLength(length) {
    // A length of zero should be the first point
    if (length <= 0) return this._points[0];
    for (const [i, segLength] of this._segmentLengths.entries()) {
      if (length <= segLength) {
        const p1 = this._points[i];
        const p2 = this._points[i + 1];
        const fraction = length / segLength;
        return new Phaser.Point(
          p1.x * (1 - fraction) + p2.x * fraction,
          p1.y * (1 - fraction) + p2.y * fraction
        );
      }
      // Length is larger than the current segment. "Travel" to the next
      // segment via reducing the length by the current segment.
      length -= segLength;
    }
    // Length requested was larger than the total length of the path, so
    // return the final point
    return this._points[this._points.length - 1];
  }

  /**
     * Get the point at a specified index along the path.
     * 
     * @param {number} index 
     * @returns {Phaser.Point}
     * 
     * @memberOf Path
     */
  getPointAtIndex(index) {
    return this._points[index];
  }

  reverse() {
    this._points.reverse();
    this._segmentLengths.reverse();
    return this;
  }

  clone(deep = true) {
    let points = this._points;
    if (deep) {
      points = [];
      for (const point of this._points) {
        points.push(point.clone());
      }
    }
    return new Path(points);
  }
}

module.exports = Path;
