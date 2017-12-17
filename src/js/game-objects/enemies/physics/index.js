// Wrapper around custom SAT exporter from Physics Editor
// - Only supports first shape defined in Physics Editor
// - First shape must be a polygon

// Transformation applied:
//
// "beetle": {
//   "width": "50",
//   "height": "75",
//   "shapes": [
//     {
//       "type": "POLYGON",
//       "hull": [ [13, 16], ... ],
//       "polygons": [ ... ]
//     }
//   ]
// }
//
// 1. Extract first shape for each
// 2. Grab the hull
// 3. Normalize the hull points
//
// ->
//
// "beetle": [ [0.1, 0.12], ... ]

import physics from "./enemies.json";

const formattedPhysics = {};

for (const enemyName in physics) {
  const width = parseInt(physics[enemyName].width, 10);
  const height = parseInt(physics[enemyName].height, 10);
  const hull = physics[enemyName].shapes[0].hull;
  formattedPhysics[enemyName] = hull.map(p => [p[0] / width, p[1] / height]);
}

export default formattedPhysics;
