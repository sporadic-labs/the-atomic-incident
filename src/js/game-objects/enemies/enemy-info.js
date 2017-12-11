import physicsShapes from "./physics";

const normalize = (points, width, height) => points.map(p => [p[0] / width, p[1] / height]);

export const ENEMY_TYPES = {
  AMOEBA: "AMOEBA",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  TURTLE: "TURTLE",
  WORM: "WORM"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. Points should be in clockwise
 * order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  AMOEBA: {
    key: "enemies/amoeba",
    collisionPoints: normalize(physicsShapes["enemies/amoeba_50"] || [], 50, 50)
  },
  BACTERIA: {
    key: "enemies/bacteria",
    collisionPoints: normalize(physicsShapes["enemies/bacteria_50"] || [], 50, 50)
  },
  BEETLE: {
    key: "enemies/beetle",
    collisionPoints: normalize(physicsShapes["enemies/beetle_50"] || [], 50, 50)
  },
  TURTLE: {
    key: "enemies/turtle",
    collisionPoints: normalize(physicsShapes["enemies/turtle_50"] || [], 50, 50)
  },
  WORM: {
    key: "enemies/worm",
    collisionPoints: normalize(physicsShapes["enemies/snail_50"] || [], 50, 50)
  }
};
