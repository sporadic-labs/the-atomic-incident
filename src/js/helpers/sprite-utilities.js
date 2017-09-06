export function applyRandomLightnessTint(sprite, h, s, l) {
  l += sprite.game.rnd.realInRange(-0.1, 0.1);
  const rgb = Phaser.Color.HSLtoRGB(h, s, l);
  sprite.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
}

export function checkOverlapWithGroup(sprite, group, callback, context) {
  // Loop through children in group
  for (let i = 0; i < group.children.length; i += 1) {
    const child = group.children[i];
    if (child instanceof Phaser.Group) {
      // If child is a group, recursion time
      checkOverlapWithGroup(sprite, child, callback, context);
    } else {
      // If child is not a group, make sure it has a SAT body
      if (!child.satBody) continue;
      // Check overlap
      const isOverlap = sprite.satBody.testOverlap(child.satBody);
      if (isOverlap) callback.call(context, sprite, child);
    }
  }
}

/**
 * Recursively collide a sprite against a group using arcade physics
 */
export function arcadeRecursiveCollide(sprite, group, callback, context) {
  // Loop through children in group
  for (let i = 0; i < group.children.length; i += 1) {
    const child = group.children[i];
    if (child instanceof Phaser.Group) {
      // If child is a group, recursion time
      arcadeRecursiveCollide(sprite, child, callback, context);
    } else {
      const arcade = sprite.game.physics.arcade;
      arcade.collide(sprite, child, callback, null, context);
    }
  }
}

/**
 * Recursively iterate through a group to find all non-Phaser.Group children
 */
export function forEachRecursive(group, callback, context) {
  // Loop through children in group
  for (let i = 0; i < group.children.length; i += 1) {
    const child = group.children[i];
    if (child instanceof Phaser.Group) {
      // If child is a group, recursion time
      forEachRecursive(child, callback, context);
    } else {
      const exitEarly = callback.call(context, child);
      if (exitEarly) return;
    }
  }
}

/**
 * Check a sprite's overlap against a tilemap layer using SAT bodies. This
 * creates a SAT body for tiles on-the-fly.
 *
 * @param {any} sprite The sprite with the SAT body
 * @param {TilemapLayer} tilemapLayer The tilemap layer to collide against.
 * @param {function} [callback] Function to run on overlap. This gets passed the
 * sprite and the tile it overlaps with. If the callback returns true,
 * satSpriteVsTilemap will exit early and stop checking for additional overlap.
 * @param {object} [context] The context to use with the callback.
 * @param {float} [fudgeFactor=0] A number of pixels to use to "fudge" the
 * collision detection. A positive value will shrink the tiles by the specifed
 * number of pixels and a negative value will inflate the tile size.
 * @returns {boolean} Whether or not a collision was detected.
 */
export function satSpriteVsTilemap(sprite, tilemapLayer, callback, context, fudgeFactor) {
  fudgeFactor = fudgeFactor || 0;
  let isOverlapDetected = false;
  const b = sprite.satBody.getAxisAlignedBounds();
  const tiles = tilemapLayer.getTiles(b.x, b.y, b.width, b.height, true);
  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    const response = sprite.satBody.collideVsRectangle({
      x: tile.worldX + fudgeFactor,
      y: tile.worldY + fudgeFactor,
      width: tile.width - fudgeFactor,
      height: tile.height - fudgeFactor
    });
    if (response === false) continue;
    isOverlapDetected = true;
    if (callback) {
      const exitEarly = callback.call(context, sprite, tile, response);
      if (exitEarly) return isOverlapDetected;
    } else return isOverlapDetected;
  }
  return isOverlapDetected;
}
