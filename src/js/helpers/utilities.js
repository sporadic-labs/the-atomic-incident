import { circle } from "../plugins/sat-body-plugin/sat-factories";

export function randomBoolean() {
  return Boolean(Math.floor(Math.random() * 2));
}

export function pointFromAngle(angle, isDegrees = false) {
  const radians = isDegrees ? angle * Math.PI / 180 : angle;
  return new Phaser.Point(Math.cos(radians), Math.sin(radians));
}

/** 
 * Fisher-Yates algorithm to shuffle an array in place. 
 * Source: https://bost.ocks.org/mike/shuffle/ 
 * */
export function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    // Random element between 0 (inclusive) and i (exclusive)
    const j = Math.floor(Math.random() * i);
    // Swap elements i and j
    const temp = array[i];
    array[i] = array[j];
    array[j] = temp;
  }
  return array;
}

/**
 * Pick an object from an array of objects using a weighted probability. Pass in an array like:
 * [
 *  { fruit: "Apple", weight: 2 },
 *  { fruit: "Banana", weight: 5.5 },
 *  { fruit: "Guava", weight: 4 }
 * ]
 * @param {objects[]} objects 
 * @param {number} [weightTotal=null] - The sum of all the weights, if known ahead of time.
 * @param {string} [weightProperty="weight"] - The property name under an object's weight is stored
 * @returns {object} One of the objects from the given array.
 */
export function weightedPick(objects, weightTotal = null, weightProperty = "weight") {
  if (weightTotal === null) {
    weightTotal = 0;
    for (const object of objects) weightTotal += object[weightProperty] || 0;
  }

  if (weightTotal <= 0) throw new Error("Weighted pick from invalid array of objects.");

  const rand = Math.random() * weightTotal;
  let runningTotal = 0;
  for (const object of objects) {
    runningTotal += object[weightProperty] || 0;
    if (rand <= runningTotal) return object;
  }

  return objects[objects.length - 1];
}

/**
 * Check whether a circle overlaps an axis-aligned rectangle (e.g. unrotated)
 * Ref: https://yal.cc/rectangle-circle-intersection-test/
 * @param {Phaser.Circle} circle 
 * @param {Phaser.Rectangle} rectangle 
 * @returns {boolean}
 */
export function circleVsRectangle(circle, rect) {
  // Clamp circle's center to the rectangle's bounds
  const nearestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
  const nearestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
  // Check if the nearest point is inside the rect
  const distSquared = Math.pow(circle.x - nearestX, 2) + Math.pow(circle.y - nearestY, 2);
  return distSquared < Math.pow(circle.radius, 2);
}
