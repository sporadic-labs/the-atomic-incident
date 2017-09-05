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
