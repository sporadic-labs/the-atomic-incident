export function debugShape(game, position, parent, shape) {
  const g = game.make.graphics(position.x, position.y);
  parent.add(g);
  g.beginFill(0xff0000, 0.5);
  g.drawShape(shape);
  g.endFill();
  return g;
}

export function applyRandomLightnessTint(sprite, h, s, l) {
  l += sprite.game.rnd.realInRange(-0.1, 0.1);
  const rgb = Phaser.Color.HSLtoRGB(h, s, l);
  sprite.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);
}

/**
 * Check a sprite's overlap against a group using SAT bodies. 
 * 
 * @param {Phaser.Sprite} sprite The sprite with the SAT body
 * @param {Phaser.Group} group The group to check overlap against.
 * @param {function} [callback] Function to run on overlap. This gets passed the original sprite and
 * the sprite it overlaps with. If the callback returns true, checkSatOverlapWithGroup will exit early
 * and stop checking for additional overlap.
 * @param {object} [context] The context to use with the callback.
 * @returns {boolean} Whether or not an overlap was detected.
 */
export function checkSatOverlapWithGroup(sprite, group, callback, context) {
  if (!sprite.satBody) return false;

  let isOverlapDetected = false;
  for (let i = 0; i < group.children.length; i += 1) {
    const child = group.children[i];
    if (child instanceof Phaser.Group) {
      checkSatOverlapWithGroup(sprite, child, callback, context);
    } else {
      if (!child.satBody) continue;

      const isOverlap = sprite.satBody.testOverlap(child.satBody);
      if (isOverlap) {
        isOverlapDetected = true;
        if (callback) {
          const exitEarly = callback.call(context, sprite, child);
          if (exitEarly) return isOverlapDetected;
        } else {
          // No callback specified, so we can exit early when we hit the first overlap
          return isOverlapDetected;
        }
      }
    }
  }

  return isOverlapDetected;
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
 * Check a sprite's overlap against a tilemap layer using SAT bodies. This creates a SAT body for
 * tiles on-the-fly.
 *
 * @param {Phaser.Sprite} sprite The sprite with the SAT body
 * @param {TilemapLayer} tilemapLayer The tilemap layer to collide against.
 * @param {function} [callback] Function to run on overlap. This gets passed the sprite and the tile
 * it overlaps with. If the callback returns true, satSpriteVsTilemap will exit early and stop
 * checking for additional overlap.
 * @param {object} [context] The context to use with the callback.
 * @param {float} [fudgeFactor=0] A number of pixels to use to "fudge" the collision detection. A
 * positive value will shrink the tiles by the specifed number of pixels and a negative value will
 * inflate the tile size.
 * @returns {boolean} Whether or not a collision was detected.
 */
export function satSpriteVsTilemap(sprite, tilemapLayer, callback, context, fudgeFactor = 0) {
  if (!sprite.satBody) return false;

  let isOverlapDetected = false;
  const b = sprite.satBody.getAxisAlignedBounds();
  const tiles = tilemapLayer.getTiles(b.x, b.y, b.width, b.height, true);
  const rect = { x: 0, y: 0, width: 0, height: 0 };

  for (let i = 0; i < tiles.length; i++) {
    const tile = tiles[i];
    rect.x = tile.worldX + fudgeFactor;
    rect.y = tile.worldY + fudgeFactor;
    rect.width = tile.width - fudgeFactor;
    rect.height = tile.height - fudgeFactor;
    const response = sprite.satBody.collideVsRectangle(rect);

    if (response) {
      isOverlapDetected = true;
      if (callback) {
        const exitEarly = callback.call(context, sprite, tile, response);
        if (exitEarly) return isOverlapDetected;
      } else {
        // No callback specified, so we can exit early when we hit the first overlap
        return isOverlapDetected;
      }
    }
  }

  return isOverlapDetected;
}
