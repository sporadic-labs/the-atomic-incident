import physicsShapes from "./physics";

export const ENEMY_TYPES = {
  // AMOEBA: "AMOEBA",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  // TURTLE: "TURTLE",
  WORM: "WORM",
  VIRUS: "VIRUS"
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
    animated: true,
    key: "enemies/bacteria",
    collisionPoints: physicsShapes["bacteria"]
  },
  BEETLE: {
    animated: true,
    key: "enemies/beetle",
    collisionPoints: physicsShapes["beetle"]
  },
  // TURTLE: {
  //   key: "enemies/turtle",
  //   collisionPoints: physicsShapes["turtle"]
  // },
  WORM: {
    animated: true,
    key: "enemies/worm",
    collisionPoints: physicsShapes["worm"]
  },
  VIRUS: {
    animated: false,
    key: "enemies/virus/virus-dark",
    collisionPoints: physicsShapes["virus-dark"]
  }
};
