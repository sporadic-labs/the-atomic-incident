import physicsShapes from "./physics";

export const ENEMY_TYPES = {
  AMOEBA: "AMOEBA",
  AMOEBA_SMALL: "AMOEBA_SMALL",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  PARTICLE_TANK: "PARTICLE_TANK",
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
  AMOEBA: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/amoeba",
    collisionPoints: physicsShapes["amoeba"]
  },
  AMOEBA_SMALL: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/amoeba",
    collisionPoints: physicsShapes["amoeba"]
  },
  BACTERIA: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/bacteria",
    collisionPoints: physicsShapes["bacteria"]
  },
  BEETLE: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/beetle",
    collisionPoints: physicsShapes["beetle"]
  },
  // TURTLE: {
  //   key: "enemies/turtle",
  //   collisionPoints: physicsShapes["turtle"]
  // },
  PARTICLE_TANK: {
    animated: false,
    health: 150,
    speed: 100,
    key: "enemies/particle-tank/particle-tank",
    collisionPoints: physicsShapes["particle-tank"]
  },
  WORM: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/worm",
    collisionPoints: physicsShapes["worm"]
  },
  VIRUS: {
    animated: false,
    health: 100,
    speed: 160,
    key: "enemies/virus/virus-dark",
    collisionPoints: physicsShapes["virus-dark"]
  }
};
