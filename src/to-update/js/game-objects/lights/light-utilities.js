/**
 * Create a polygon that represents a spotlight
 *
 * @param {number} orientation Direction to face the light (in degrees).
 * Orientation is counter-clockwise with 0 degrees facing right.
 * @param {any} span Degrees that the light should span (in degrees)
 * @param {any} range Length of spotlight
 */
export function generateSpotlightPolygon(orientation, span, range) {
  const lightOrientation = orientation * Math.PI / 180;
  const lightArcAngle = span * Math.PI / 180;
  const arcSamples = 6;
  const lightPoints = [new Phaser.Point(0, 0)];
  for (let i = 0; i <= arcSamples; i += 1) {
    const percent = i / arcSamples;
    const currentAngle = lightArcAngle / 2 - lightArcAngle * percent;
    lightPoints.push(
      new Phaser.Point(
        Math.cos(lightOrientation + currentAngle) * range,
        Math.sin(lightOrientation + currentAngle) * range
      )
    );
  }
  const polygon = new Phaser.Polygon(lightPoints);
  return polygon;
}
