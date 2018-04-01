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
    moveFrames: 16,
    key: "enemies_v2/enemy_splitting_large",
    collisionPoints: physicsShapes["amoeba"]
  },
  DIVIDING_SMALL: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies_v2/enemy_splitting_small",
    collisionPoints: physicsShapes["amoeba"]
  },
  FOLLOWING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies_v2/enemy_tracking_small",
    collisionPoints: physicsShapes["beetle"]
  },
  TANK: {
    animated: true,
    health: 150,
    speed: 100,
    moveFrames: 16,
    key: "enemies_v2/mini_boss_charging",
    collisionPoints: physicsShapes["particle-tank"]
  },
  DASHING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies_v2/enemy_charging",
    collisionPoints: physicsShapes["worm"]
  },
  PROJECTILE: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies_v2/enemy_shooting",
    collisionPoints: physicsShapes["virus-dark"]
  }
};
