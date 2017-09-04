export function randomBoolean() {
  return Boolean(Math.floor(Math.random() * 2));
}

export function pointFromAngle(angle, isDegrees) {
  const radians = isDegrees ? angle * Math.PI / 180 : angle;
  return new Phaser.Point(Math.cos(radians), Math.sin(radians));
}

export function map(num, min1, max1, min2, max2, options) {
  let mapped = (num - min1) / (max1 - min1) * (max2 - min2) + min2;
  if (!options) return mapped;
  if (options.round && options.round === true) {
    mapped = Math.round(mapped);
  }
  if (options.floor && options.floor === true) {
    mapped = Math.floor(mapped);
  }
  if (options.ceil && options.ceil === true) {
    mapped = Math.ceil(mapped);
  }
  if (options.clamp && options.clamp === true) {
    mapped = Math.min(mapped, max2);
    mapped = Math.max(mapped, min2);
  }
  return mapped;
}

export function tiledColorToRgb(hexColor) {
  // Tiled colors are in the format #AARRGGBB
  const a = parseInt(hexColor.substring(1, 3), 16);
  const r = parseInt(hexColor.substring(3, 5), 16);
  const g = parseInt(hexColor.substring(5, 7), 16);
  const b = parseInt(hexColor.substring(7), 16);
  return Phaser.Color.getColor32(a, r, g, b);
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
