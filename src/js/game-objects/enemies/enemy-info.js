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
    animated: false,
    health: 100,
    speed: 160,
    key: "test/enemy_splitting_large/test_0",
    collisionPoints: physicsShapes["amoeba"]
  },
  DIVIDING_SMALL: {
    animated: false,
    health: 100,
    speed: 160,
    key: "test/enemy_splitting_small/test_0",
    collisionPoints: physicsShapes["amoeba"]
  },
  FOLLOWING: {
    animated: false,
    health: 100,
    speed: 160,
    key: "test/enemy_tracking_small/test_0",
    collisionPoints: physicsShapes["beetle"]
  },
  TANK: {
    animated: false,
    health: 150,
    speed: 100,
    key: "test/mini_boss_charging/test_0",
    collisionPoints: physicsShapes["particle-tank"]
  },
  DASHING: {
    animated: false,
    health: 100,
    speed: 160,
    key: "test/enemy_charging/test_0",
    collisionPoints: physicsShapes["worm"]
  },
  PROJECTILE: {
    animated: false,
    health: 100,
    speed: 160,
    key: "test/enemy_shooting/test_0",
    collisionPoints: physicsShapes["virus-dark"]
  }
};
