/**
 * Create a polygon that represents a spotlight
 *
 * @param {number} orientation Direction to face the light (in degrees).
 * Orientation is counter-clockwise with 0 degrees facing right.
 * @param {any} span Degrees that the light should span (in degrees)
 * @param {any} range Length of spotlight
 */
module.exports.generateSpotlightPolygon = function(orientation, span, range) {
  var lightOrientation = orientation * Math.PI / 180;
  var lightArcAngle = span * Math.PI / 180;
  var arcSamples = 6;
  var lightPoints = [new Phaser.Point(0, 0)];
  for (var i = 0; i <= arcSamples; i += 1) {
    var percent = i / arcSamples;
    var currentAngle = lightArcAngle / 2 - lightArcAngle * percent;
    lightPoints.push(
      new Phaser.Point(
        Math.cos(lightOrientation + currentAngle) * range,
        Math.sin(lightOrientation + currentAngle) * range
      )
    );
  }
  var polygon = new Phaser.Polygon(lightPoints);
  return polygon;
};
