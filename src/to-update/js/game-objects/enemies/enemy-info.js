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
    key: "enemies/splitting_large",
    collisionPoints: physicsShapes["DIVIDING"]
  },
  DIVIDING_SMALL: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/splitting_small",
    collisionPoints: physicsShapes["DIVIDING_SMALL"]
  },
  FOLLOWING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/tracking_small",
    collisionPoints: physicsShapes["FOLLOWING"]
  },
  TANK: {
    animated: true,
    health: 150,
    speed: 100,
    moveFrames: 16,
    key: "enemies/mini_boss_charging",
    collisionPoints: physicsShapes["TANK"]
  },
  DASHING: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/charging",
    collisionPoints: physicsShapes["DASHING"]
  },
  PROJECTILE: {
    animated: true,
    health: 100,
    speed: 160,
    moveFrames: 16,
    key: "enemies/shooting",
    collisionPoints: physicsShapes["PROJECTILE"]
  }
};
