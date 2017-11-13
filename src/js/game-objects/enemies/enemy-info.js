const normalize = (points, width, height) => points.map(p => [p[0] / width, p[1] / height]);

export const ENEMY_TYPES = {
  TURTLE: "TURTLE",
  TEAL_CELL: "TEAL_CELL",
  GREEN_CELL: "GREEN_CELL"
};

/**
 * Collection of info about the different enemies - asset key & collision polygon points for now.
 * Width & height are just used to make collision points relative. Points should be in clockwise
 * order (as viewed in photoshop).
 */
export const ENEMY_INFO = {
  GREEN_CELL: {
    key: "enemies/green-cell",
    collisionPoints: normalize([[25, 0], [34, 9], [34, 40], [25, 50], [16, 40], [16, 9]], 50, 50)
  },
  TURTLE: {
    key: "enemies/turtle_50",
    collisionPoints: normalize(
      [[25, 8], [40, 18], [41, 28], [34, 41], [14, 41], [8, 28], [9, 18]],
      50,
      50
    )
  },
  TEAL_CELL: {
    key: "enemies/teal-cell",
    collisionPoints: normalize([[25, 2], [42, 32], [33, 46], [15, 46], [7, 32]], 50, 50)
  }
};
