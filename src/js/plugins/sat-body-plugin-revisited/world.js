import rbush from "rbush";
import BODY_SHAPES from "./body-shapes";
import BODY_TYPES from "./body-types";
import SAT from "sat";
import Body from "./body";

const P = Phaser.Point;
const globalResponse = new SAT.Response();
const globalTreeSearch = { minX: 0, minY: 0, maxX: 0, maxY: 0 };

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
  addCollider() {}
  addOverlap() {}
  removeCollider() {}
  update() {}
  collider() {}

  add(body) {
    if (body.bodyType === BODY_TYPES.STATIC) this.staticBodies.add(body);
    else if (body.bodyType === BODY_TYPES.DYNAMIC) this.bodies.add(body);
    return this;
  }

  remove(body) {
    this.bodies.delete(body);
    return this;
  }

  enableDebug(graphics) {
    this.drawDebug = true;
    this.debugGraphics = graphics ? graphics : this.game.add.graphics(0, 0);
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

  collide(object1, object2) {
    // Strip away some of the branching logic by extracting the body from the objects
    if (object1.physicsType === Phaser.SPRITE) object1 = object1.body;
    if (object2.physicsType === Phaser.SPRITE) object2 = object2.body;

    if (object1.isSatBody) {
      if (object2.isSatBody) {
        this.collideBodyVsBody(object1, object2);
      } else if (object2.physicsType === Phaser.GROUP) {
        this.collideBodyVsGroup(object1, object2);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        this.collideBodyVsTilemapLayer(object1, object2);
      }
    } else if (object1.physicsType === Phaser.GROUP) {
      if (object2.isSatBody) {
        this.collideBodyVsGroup(object2, object1);
      } else if (object2.physicsType === Phaser.GROUP) {
        console.warn("Colliding group vs group is not supported yet!");
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        this.collideGroupVsTilemapLayer(object1, object2);
      }
    } else if (object1.physicsType === Phaser.TILEMAPLAYER) {
      if (object2.isSatBody) {
        this.collideBodyVsGroup(object2, object1);
      } else if (object2.physicsType === Phaser.GROUP) {
        this.collideGroupVsTilemapLayer(object2, object1);
      } else if (object2.physicsType === Phaser.TILEMAPLAYER) {
        console.warn("Colliding group vs tilemap layer is not supported!");
      }
    }
  }

  collideSpriteVsTilemapLayer(sprite, tilemapLayer) {
    if (!sprite.body) return false;
    return this.collideBodyVsTilemapLayer(sprite.body, tilemapLayer);
  }

  collideGroupVsTilemapLayer(group, tilemapLayer) {
    let collides = false;
    group.children.forEach(child => {
      if (child.body && this.collideSpriteVsTilemapLayer(child, tilemapLayer)) collides = true;
    });
    return collides;
  }

  collideSpriteVsSprite(sprite1, sprite2) {
    if (!sprite1.body || !sprite2.body) return false;
    const collides = this.checkBodyCollide(sprite1.body, sprite2.body, globalResponse);
    if (collides) this.separateBodies(sprite1.body, sprite2.body, globalResponse);
    return collides;
  }

  // Not recursive! Assumes the group only has SAT bodies
  collideSpriteVsGroup(sprite, group) {
    if (!sprite.body || group.length === 0) return false;
    return this.collideBodyVsGroup(sprite.body, group);
  }

  collideBodyVsBody(body1, body2) {
    const collides = this.checkBodyCollide(body1, body2, globalResponse);
    if (collides) this.separateBodies(body1, body2, globalResponse);
    return collides;
  }

  // Not recursive! Assumes the group only has SAT bodies
  collideBodyVsGroup(body, group) {
    globalTreeSearch.minX = body.left;
    globalTreeSearch.minY = body.top;
    globalTreeSearch.maxX = body.right;
    globalTreeSearch.maxY = body.bottom;

    const results = this.tree.search(globalTreeSearch);
    if (results.length === 0) return false;

    let collides = false;
    group.children.forEach(child => {
      if (!child.body || body === child.body || !results.includes(child.body)) return;
      if (this.collideBodyVsBody(body, child.body)) collides = true;
    });

    return collides;
  }

  collideBodyVsTilemapLayer(body, tilemapLayer) {
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
        this.separateBodiesDynamicVsStatic(body, tileBody, globalResponse);
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
      this.separateBodiesStaticVsDynamic(body1, body2, response);
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
    body1.position.x -= (2 + response.overlap) * response.overlapN.x;
    body1.position.y -= (2 + response.overlap) * response.overlapN.y;
    body1.updateSatBodyPosition();

    // Adjust velocity
    if (Math.abs(response.overlapN.x) > 0) body1.velocity.x *= -body1.bounce;
    if (Math.abs(response.overlapN.y) > 0) body1.velocity.y *= -body1.bounce;
  }

  separateBodiesStaticVsDynamic(body1, body2, response) {
    // Resolve overlap
    body2.position.x += response.overlap * response.overlapN.x;
    body2.position.y += response.overlap * response.overlapN.y;

    // Adjust velocity
    if (Math.abs(response.overlapN.x) > 0) body2.velocity.x *= -body2.bounce;
    if (Math.abs(response.overlapN.y) > 0) body2.velocity.y *= -body2.bounce;
  }

  destroy() {
    if (this.leftWall) this.leftWall.destroy();
    if (this.rightWall) this.rightWall.destroy();
    if (this.topWall) this.topWall.destroy();
    if (this.bottomWall) this.bottomWall.destroy();
    if (this.debugGraphics) this.debugGraphics.destroy();
    this.bodies.clear();
    this.staticBodies.clear();
  }
}
