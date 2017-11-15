// Wrapper around p2 shapes exported from Physics Editor
import physics from "./enemies.json";

const formattedPhysics = {};

for (const enemyName in physics) {
  const shape = physics[enemyName][0].shape;
  const points = [];
  for (let i = 0; i < shape.length; i += 2) {
    points.push([shape[i], shape[i + 1]]);
  }
  formattedPhysics[`enemies/${enemyName}`] = points;
}

export default formattedPhysics;

// "amoeba_50": [
//     {
//         "shape": [ 7,20, 24,6, 43,20, 37,43, 11,43 ]
//     }
// ]
//
// ->
//
// "enemies/amoeba_50": [
//     {
//         "shape": [ [7,20], [24,6], [43,20], [37,43], [11,43] ]
//     }
// ]
