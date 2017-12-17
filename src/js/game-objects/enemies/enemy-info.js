import physicsShapes from "./physics";

export const ENEMY_TYPES = {
  // AMOEBA: "AMOEBA",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  // TURTLE: "TURTLE",
  WORM: "WORM"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. Points should be in clockwise
 * order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  // AMOEBA: {
  //   key: "enemies/amoeba",
  //   collisionPoints: physicsShapes["amoeba"]
  // },
  BACTERIA: {
    key: "enemies/bacteria",
    collisionPoints: physicsShapes["bacteria"]
  },
  BEETLE: {
    key: "enemies/beetle",
    collisionPoints: physicsShapes["beetle"]
  },
  // TURTLE: {
  //   key: "enemies/turtle",
  //   collisionPoints: physicsShapes["turtle"]
  // },
  WORM: {
    key: "enemies/worm",
    collisionPoints: physicsShapes["worm"]
  }
};
