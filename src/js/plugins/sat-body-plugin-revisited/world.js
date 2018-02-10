import rbush from "rbush";
import BODY_SHAPES from "./body-shapes";
import BODY_TYPES from "./body-types";
import SAT from "sat";
import Body from "./body";

const P = Phaser.Point;
const globalResponse = new SAT.Response();
const globalTreeSearch = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
const reverseCallback = (cb, context) => {
  if (!cb) return null;
  else return (arg1, arg2) => cb.call(context, arg2, arg1);
};

export default class World {
  /**
   * 
   * @param {Phaser.Game} game 
   * @param {*} satPlugin 
   */
  constructor(game, satPlugin) {
    this.game = game;
    this.satPlugin = satPlugin;

    this.drawDebug = false;
    this.debugGraphics = null;

    this.bodies = [];
    this.colliders = [];

    this.bodies = new Set();
    this.staticBodies = new Set();

    this.gravity = new P(0, 0);

    this.maxEntries = 16;
    this.tree = new rbush(this.maxEntries, [".left", ".top", ".right", ".bottom"]);
    this.staticTree = new rbush(this.maxEntries, [".left", ".top", ".right", ".bottom"]);

    // TODO:
    // - Support static bodies. Right now there is a tree, but it is never searched.
    // - Add overlap only functionality. Right now everything collides.
    // - Add sensors
    // - Allow for colliding arrays

    // Helpful references:
    // https://www.toptal.com/game/video-game-physics-part-i-an-introduction-to-rigid-body-dynamics
    // https://gamedevelopment.tutsplus.com/tutorials/how-to-create-a-custom-2d-physics-engine-oriented-rigid-bodies--gamedev-8032
  }

  // NOOP methods, to be implemented later:
  enable() {}
  disable() {}
  pause() {}
  resume() {}
  addOverlap() {}

  add(body) {
    if (body.bodyType === BODY_TYPES.STATIC) this.staticBodies.add(body);
    else if (body.bodyType === BODY_TYPES.DYNAMIC) this.bodies.add(body);
    return this;
  }

  remove(body) {
    if (body.bodyType === BODY_TYPES.STATIC) this.staticBodies.delete(body);
    else if (body.bodyType === BODY_TYPES.DYNAMIC) this.bodies.delete(body);
    return this;
  }

  addCollider(collider) {
    this.colliders.push(collider);
    return this;
  }

  removeCollider(collider) {
    this.colliders = this.colliders.filter(c => c !== collider);
    return this;
  }

  enableDebug(graphics) {
    this.drawDebug = true;
    if (this.debugGraphics) {
      if (graphics) {
        this.debugGraphics.destroy();
        this.debugGraphics = graphics;
      } else {
        // Noop - we're all good to reuse this.debugGraphics
      }
    } else {
      this.debugGraphics = graphics ? graphics : this.game.add.graphics(0, 0);
    }
    return this;
  }

  disableDebug() {
    this.drawDebug = false;
    if (this.debugGraphics) this.debugGraphics.destroy();
    return this;
  }

  setBounds(
    x,
    y,
    width,
    height,
    thickness = 200,
    left = true,
    right = true,
    top = true,
    bottom = true
  ) {
    if (this.leftWall) this.leftWall.destroy();
    if (this.rightWall) this.rightWall.destroy();
    if (this.topWall) this.topWall.destroy();
    if (this.bottomWall) this.bottomWall.destroy();

    if (left) {
      this.leftWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(thickness, height + 2 * thickness)
        .setPosition(x - thickness, y - thickness);
      this.add(this.leftWall);
    }
    if (right) {
      this.rightWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(thickness, height + 2 * thickness)
        .setPosition(x + width, y - thickness);
      this.add(this.rightWall);
    }
    if (top) {
      this.topWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(width + 2 * thickness, thickness)
        .setPosition(x - thickness, y - thickness);
      this.add(this.topWall);
    }
    if (bottom) {
      this.bottomWall = new Body(this, { bodyType: BODY_TYPES.STATIC })
        .setRectangle(width + 2 * thickness, thickness)
        .setPosition(x - thickness, y + height);
      this.add(this.bottomWall);
    }
  }

  preUpdate() {
    // Only preUpdate bodies without GOs, since v2 Phaser sprites automatically call preUpdate
    this.bodies.forEach(body => {
      if (!body.gameObject) body.preUpdate();
    });
    this.staticBodies.forEach(body => {
      if (!body.gameObject) body.preUpdate();
    });

    if (this.bodies.size === 0) return;

    // Reload the tree with all the enabled bodies
    const enabledBodies = [];
    for (const body of this.bodies) if (body.enabled) enabledBodies.push(body);
    this.tree.clear();
    this.tree.load(enabledBodies);
  }

  update() {
    this.colliders.forEach(collider => collider.update());
  }

  postUpdate() {
    // Only postUpdate bodies without GOs, since v2 Phaser sprites automatically call postUpdate
    this.bodies.forEach(body => {
      if (!body.gameObject) body.postUpdate();
    });

    this.staticBodies.forEach(body => {
      if (!body.gameObject) body.postUpdate();
    });

    if (this.drawDebug) this.debugDraw(this.debugGraphics);
  }

  debugDraw(graphics) {
    graphics.clear();
    this.staticBodies.forEach(body => body.drawDebug(graphics));
    this.bodies.forEach(body => body.drawDebug(graphics));
  }

  overlap(object1, object2, options = {}) {
    options.separate = false;
    return this.collide(object1, object2, options);
  }

  // Sprite|Body|Group|TilemapLayer vs Sprite|Body|Group|TilemapLayer
  // Options: onCollide, context, separateBodies
  collide(object1, object2, { onCollide, context, separate = true } = {}) {
    const object1IsObject = object1.isSatBody || object1.physicsType === Phaser.SPRITE;
    const object2IsObject = object2.isSatBody || object2.physicsType === Phaser.SPRITE;

    if (object1IsObject) {
      if (object2IsObject) {
        return this.collideObjectVsObject(object1, object2, onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        return this.collideObjectVsGroup(object1, object2, onCollide, context, separate);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        return this.collideObjectVsTilemapLayer(object1, object2, onCollide, context, separate);
      }
    } else if (object1.physicsType === Phaser.GROUP) {
      if (object2IsObject) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideObjectVsGroup(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        console.warn("Colliding group vs group is not supported yet!");
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        return this.collideGroupVsTilemapLayer(object1, object2, onCollide, context, separate);
      }
    } else if (object1.physicsType === Phaser.TILEMAPLAYER) {
      if (object2IsObject) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideObjectVsTilemapLayer(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.GROUP) {
        const _onCollide = reverseCallback(onCollide, context);
        return this.collideGroupVsTilemapLayer(object2, object1, _onCollide, context, separate);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        console.warn("Colliding group vs tilemap layer is not supported!");
      }
    }

    return false;
  }

  // Body||Sprite vs Body||Sprite
  collideObjectVsObject(object1, object2, onCollide, context, separate = true) {
    const body1 = object1.isSatBody ? object1 : object1.body;
    const body2 = object2.isSatBody ? object2 : object2.body;

    // Bodies may get destroyed by the user mid-collisions
    if (!body1 || !body2) return false;

    const collides = this.checkBodyCollide(body1, body2, globalResponse);
    if (collides) {
      if (separate) this.separateBodies(body1, body2, globalResponse);
      if (onCollide) onCollide.call(context, object1, object2);
    }
    return collides;
  }

  // Body||Sprite vs Group, careful this can be recursive if a group contains a group!
  collideObjectVsGroup(object, group, onCollide, context, separate = true) {
    if (group.length === 0) return false;

    const body1 = object.isSatBody ? object : object.body;

    // Bodies may get destroyed by the dev mid-collisions
    if (!body1) return false;

    globalTreeSearch.minX = body1.left;
    globalTreeSearch.minY = body1.top;
    globalTreeSearch.maxX = body1.right;
    globalTreeSearch.maxY = body1.bottom;

    const results = this.tree.search(globalTreeSearch);
    if (results.length === 0) return false;

    let collisionDetected = false;
    group.children.forEach(child => {
      if (child.physicsType === Phaser.GROUP) {
        return this.collideObjectVsGroup(object, child, onCollide, context, separate);
      }

      const body2 = child.body;
      if (!body2 || !body2.isSatBody || body1 === body2 || !results.includes(body2)) return;

      const collides = this.checkBodyCollide(body1, body2, globalResponse);
      if (collides) {
        collisionDetected = true;
        if (separate) this.separateBodies(body1, body2, globalResponse);
        if (onCollide) onCollide.call(context, object, child);
      }
    });

    return collisionDetected;
  }

  // Body||Sprite vs TilemapLayer
  collideObjectVsTilemapLayer(object, tilemapLayer, onCollide, context, separate = true) {
    const body = object.isSatBody ? object : object.body;

    // Bodies may get destroyed by the dev mid-collisions
    if (!body) return false;

    const layerOffsetX = tilemapLayer.getTileOffsetX();
    const layerOffsetY = tilemapLayer.getTileOffsetY();
    const tiles = tilemapLayer.getTiles(
      body.left - layerOffsetX,
      body.top - layerOffsetY,
      body.width,
      body.height,
      true,
      false
    );

    if (tiles.length === 0) return false;

    const tileWidth = tilemapLayer.map.tileWidth;
    const tileHeight = tilemapLayer.map.tileHeight;

    const tileBody = new Body(this, { bodyType: BODY_TYPES.STATIC }).setRectangle(
      tileWidth,
      tileHeight
    );

    let collides = false;
    tiles.map(tile => {
      tileBody.setPosition(layerOffsetX + tile.worldX, layerOffsetY + tile.worldY);
      const tileCollides = this.checkBodyCollide(body, tileBody, globalResponse);
      if (tileCollides) {
        collides = true;
        if (separate) this.separateBodiesDynamicVsStatic(body, tileBody, globalResponse);
        if (onCollide) onCollide.call(context, object, tile);
      }
    });

    return collides;
  }

  collideGroupVsTilemapLayer(group, tilemapLayer, onCollide, context, separate = true) {
    let collides = false;
    group.children.forEach(child => {
      if (!child.body || !child.body.isSatBody) return;
      if (this.collideObjectVsTilemapLayer(child, tilemapLayer, onCollide, context, separate)) {
        collides = true;
      }
    });
    return collides;
  }

  checkBodyOverlap(bodyA, bodyB) {
    return this.checkBodyCollide(bodyA, bodyB, null);
  }

  checkBodyCollide(bodyA, bodyB, response = new SAT.Response()) {
    response.clear();

    const aIsCircle = bodyA.bodyShape === BODY_SHAPES.CIRCLE;
    const bIsCircle = bodyB.bodyShape === BODY_SHAPES.CIRCLE;
    let collides = false;

    if (aIsCircle && bIsCircle) {
      collides = SAT.testCircleCircle(bodyA.satBody, bodyB.satBody, response);
    } else if (!aIsCircle && bIsCircle) {
      collides = SAT.testPolygonCircle(bodyA.satBody, bodyB.satBody, response);
    } else if (aIsCircle && !bIsCircle) {
      collides = SAT.testCirclePolygon(bodyA.satBody, bodyB.satBody, response);
      // Note: technically less efficient, but this keeps the response's a & b in the same order as
      // the collide arguments
    } else {
      collides = SAT.testPolygonPolygon(bodyA.satBody, bodyB.satBody, response);
    }

    return collides ? response : false;
  }

  separateBodies(body1, body2, response) {
    if (body1.bodyType === BODY_TYPES.DYNAMIC && body2.bodyType === BODY_TYPES.DYNAMIC) {
      this.separateBodiesDynamicVsDynamic(body1, body2, response);
    } else if (body1.bodyType === BODY_TYPES.DYNAMIC && body2.bodyType === BODY_TYPES.STATIC) {
      this.separateBodiesDynamicVsStatic(body1, body2, response);
    } else if (body1.bodyType === BODY_TYPES.STATIC && body2.bodyType === BODY_TYPES.DYNAMIC) {
      response.overlapN.reverse();
      response.overlapV.reverse();
      this.separateBodiesDynamicVsStatic(body1, body2, response);
    }
  }

  separateBodiesDynamicVsDynamic(body1, body2, response) {
    // Resolve overlap
    const halfResponse = response.overlap / 2;
    body1.position.x -= halfResponse * response.overlapN.x;
    body1.position.y -= halfResponse * response.overlapN.y;
    body2.position.x += halfResponse * response.overlapN.x;
    body2.position.y += halfResponse * response.overlapN.y;

    // Adjust velocity (pulled from v2 AP)
    const vx1 = body1.velocity.x;
    const vy1 = body1.velocity.y;
    const vx2 = body2.velocity.x;
    const vy2 = body2.velocity.y;
    let vx1New = Math.sqrt(vx2 * vx2 * body2.mass / body1.mass) * (vx2 > 0 ? 1 : -1);
    let vx2New = Math.sqrt(vx1 * vx1 * body1.mass / body2.mass) * (vx1 > 0 ? 1 : -1);
    const vxAve = (vx1New + vx2New) / 2;
    vx1New -= vxAve;
    vx2New -= vxAve;
    body1.velocity.x = vxAve + vx1New * body1.bounce;
    body2.velocity.x = vxAve + vx2New * body2.bounce;
    let vy1New = Math.sqrt(vy2 * vy2 * body2.mass / body1.mass) * (vy2 > 0 ? 1 : -1);
    let vy2New = Math.sqrt(vy1 * vy1 * body1.mass / body2.mass) * (vy1 > 0 ? 1 : -1);
    const vyAve = (vx1New + vx2New) / 2;
    vx1New -= vxAve;
    vx2New -= vxAve;
    body1.velocity.y = vyAve + vy1New * body1.bounce;
    body2.velocity.y = vyAve + vy2New * body2.bounce;
  }

  separateBodiesDynamicVsStatic(body1, body2, response) {
    // Resolve overlap
    body1.position.x -= response.overlap * response.overlapN.x;
    body1.position.y -= response.overlap * response.overlapN.y;
    body1.updateSatBodyPosition();

    // Use AABB vs AABB reflection as the default
    const newVelocity = new Phaser.Point(
      Math.abs(response.overlapN.x) > 0 ? -body1.bounce * body1.velocity.x : body1.velocity.x,
      Math.abs(response.overlapN.y) > 0 ? -body1.bounce * body1.velocity.y : body1.velocity.y
    );

    // Special circle vs AABB reflection logic. The above reflection is fine as long as we aren't
    // hitting a corner. If we are, then we need to reflect based on response normal.
    if (body1.bounce !== 0 && body1.bodyShape === BODY_SHAPES.CIRCLE) {
      const cx = body1.satBody.pos.x;
      const cy = body1.satBody.pos.y;
      const r = body1.satBody.r;
      if (body2.bodyShape !== BODY_SHAPES.CIRCLE) {
        let closestDistance = Number.MAX_VALUE;
        let normal = new Phaser.Point();
        for (let { x, y } of body2.satBody.calcPoints) {
          x += body2.satBody.pos.x;
          y += body2.satBody.pos.y;
          const d = Math.sqrt(Math.pow(x - cx, 2) + Math.pow(y - cy, 2));
          if ((d < r || Phaser.Math.fuzzyEqual(d, r)) && d < closestDistance) {
            closestDistance = d;
            normal.setTo(cx - x, cy - y);
          }
        }
        if (closestDistance !== Number.MAX_VALUE) {
          // Reflection logic: http://www.3dkingdoms.com/weekly/weekly.php?a=2
          normal.normalize();
          const vNormalLength = -2 * body1.velocity.dot(normal);
          const vNormal = normal.multiply(vNormalLength, vNormalLength);
          Phaser.Point.add(body1.velocity, vNormal, newVelocity);
          newVelocity.multiply(body1.bounce, body1.bounce);
        }
      }
    }

    body1.velocity.x = newVelocity.x;
    body1.velocity.y = newVelocity.y;

    // TODO: find contact points. Further reading:
    // http://www.dyn4j.org/2011/11/contact-points-using-clipping/
  }

  destroy() {
    if (this.leftWall) this.leftWall.destroy();
    if (this.rightWall) this.rightWall.destroy();
    if (this.topWall) this.topWall.destroy();
    if (this.bottomWall) this.bottomWall.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
    this.colliders.forEach(collider => collider.destroy());
    this.bodies.clear();
    this.staticBodies.clear();
  }
}
