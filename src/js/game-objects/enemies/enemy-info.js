import physicsShapes from "./physics";

const normalize = (points, width, height) => points.map(p => [p[0] / width, p[1] / height]);

export const ENEMY_TYPES = {
  GREEN_CELL: "GREEN_CELL",
  TURTLE: "TURTLE",
  TEAL_CELL: "TEAL_CELL",
  AMOEBA: "AMOEBA",
  BACTERIA: "BACTERIA",
  BEETLE: "BEETLE",
  GORILLA: "GORILLA",
  PARTICLE_CREATURE: "PARTICLE_CREATURE",
  PARTICLE_CREATURE_DARK: "PARTICLE_CREATURE_DARK",
  PURPLE_CELL: "PURPLE_CELL",
  SNAIL: "SNAIL",
  VIRUS: "VIRUS",
  VIRUS_DARK: "VIRUS_DARK"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. Points should be in clockwise
 * order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  GREEN_CELL: {
    key: "enemies/green-cell",
    collisionPoints: normalize(physicsShapes["enemies/green-cell"] || [], 50, 50)
  },
  TURTLE: {
    key: "enemies/turtle_50",
    collisionPoints: normalize(physicsShapes["enemies/turtle_50"] || [], 50, 50)
  },
  TEAL_CELL: {
    key: "enemies/teal-cell",
    collisionPoints: normalize(physicsShapes["enemies/teal-cell"] || [], 50, 50)
  },
  AMOEBA: {
    key: "enemies/amoeba_50",
    collisionPoints: normalize(physicsShapes["enemies/amoeba_50"] || [], 50, 50)
  },
  BACTERIA: {
    key: "enemies/bacteria_50",
    collisionPoints: normalize(physicsShapes["enemies/bacteria_50"] || [], 50, 50)
  },
  BEETLE: {
    key: "enemies/beetle_50",
    collisionPoints: normalize(physicsShapes["enemies/beetle_50"] || [], 50, 50)
  },
  GORILLA: {
    key: "enemies/gorilla_50",
    collisionPoints: normalize(physicsShapes["enemies/gorilla_50"] || [], 50, 50)
  },
  PARTICLE_CREATURE: {
    key: "enemies/particle-creature",
    collisionPoints: normalize(physicsShapes["enemies/particle-creature"] || [], 50, 50)
  },
  PARTICLE_CREATURE_DARK: {
    key: "enemies/particle-creature-dark",
    collisionPoints: normalize(physicsShapes["enemies/particle-creature-dark"] || [], 50, 50)
  },
  PURPLE_CELL: {
    key: "enemies/purple-cell",
    collisionPoints: normalize(physicsShapes["enemies/purple-cell"] || [], 50, 50)
  },
  SNAIL: {
    key: "enemies/snail_50",
    collisionPoints: normalize(physicsShapes["enemies/snail_50"] || [], 50, 50)
  },
  VIRUS: {
    key: "enemies/virus",
    collisionPoints: normalize(physicsShapes["enemies/virus"] || [], 50, 50)
  },
  VIRUS_DARK: {
    key: "enemies/virus-dark",
    collisionPoints: normalize(physicsShapes["enemies/virus-dark"] || [], 50, 50)
  }
};
