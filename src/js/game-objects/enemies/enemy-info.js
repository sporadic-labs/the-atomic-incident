import physicsShapes from "./physics";

export const ENEMY_TYPES = {
  DIVIDING: "DIVIDING",
  DIVIDING_SMALL: "DIVIDING_SMALL",
  FOLLOWING: "FOLLOWING",
  DASHING: "DASHING",
  TANK: "TANK",
  PROJECTILE: "PROJECTILE"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. Points should be in clockwise
 * order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  DIVIDING: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/amoeba",
    collisionPoints: physicsShapes["amoeba"]
  },
  DIVIDING_SMALL: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/amoeba",
    collisionPoints: physicsShapes["amoeba"]
  },
  FOLLOWING: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/beetle",
    collisionPoints: physicsShapes["beetle"]
  },
  TANK: {
    animated: false,
    health: 150,
    speed: 100,
    key: "enemies/particle-tank/particle-tank",
    collisionPoints: physicsShapes["particle-tank"]
  },
  DASHING: {
    animated: true,
    health: 100,
    speed: 160,
    key: "enemies/worm",
    collisionPoints: physicsShapes["worm"]
  },
  PROJECTILE: {
    animated: false,
    health: 100,
    speed: 160,
    key: "enemies/virus/virus-dark",
    collisionPoints: physicsShapes["virus-dark"]
  }
};
