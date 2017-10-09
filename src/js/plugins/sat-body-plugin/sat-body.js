/**
 * MH: now that our use case for SATs has converged, this API could be cleaned up and simplified.
 * 
 * TODO:
 * - Do we need to worry problems with coordinate systems not matching for collisions? If so,
 *   overlap should happen with world coordinates.
 * - Do we need the option for a SAT body to be composed of multiple shapes, e.g. a box plus a
 *   circle?
 * - Do we need there to be a possible offset between the sprite's anchor and this SatBody? If so,
 *   we need to track that.
 * - Do we need to consider scale and pivot?
 */

import SAT from "sat";
import { vec, circle, box, polygon } from "./sat-factories";

export default class SatBody {
  static BODY_TYPE = {
    BOX: "box",
    CIRCLE: "circle",
    POLYGON: "polygon"
  };

  constructor(plugin, sprite) {
    this.game = sprite.game;
    this._sprite = sprite;
    this._plugin = plugin;
    const b = sprite.body ? sprite.body : sprite;
    this._lastBodySize = { w: b.width, h: b.height };
    this.disableDebug();
    // Schedule clean up when parent sprite owner is destroyed
    sprite.events.onDestroy.add(() => this.destroy());
  }

  // MH: Needs better testing before being used widely!
  initPolygon(points) {
    this._bodyType = SatBody.BODY_TYPE.POLYGON;
    const b = this._sprite.body ? this._sprite.body : this._sprite;
    this._body = polygon(vec(b.x, b.y), points.map(p => vec(p.x, p.y)));
    return this;
  }

  /**
   * Creates a SAT box for the sprite. If there is an arcade body, it is used as reference for the
   * sat body position, width and height. The SAT box has an offset to ensure rotation works
   * properly. If there is no arcade body, the sprite is used as reference, and the sprites anchor
   * is used to calculate offset.
   * @returns {this}
   * @memberof SatBody
   */
  initBox() {
    this._bodyType = SatBody.BODY_TYPE.BOX;
    const b = this._sprite.body ? this._sprite.body : this._sprite;
    this._boxBody = box(vec(b.x, b.y), b.width, b.height);
    this._body = this._boxBody.toPolygon();
    // Update position of sat body differently based on whether there is an arcade body or not.
    if (this._sprite.body) {
      // SAT body is currently at arcade body position, which is anchored at (0, 0). To ensure that
      // rotation works, use SAT.js offset to shift the SAT points to the center before rotation is
      // applied.
      this._body.setOffset(vec(-b.width / 2, -b.height / 2));
    } else {
      const anchor = this._sprite.anchor;
      this._body.translate(-anchor.x, -anchor.y * (b.height / 2));
    }
    // Arcade body is anchored at (0, 0). To ensure that rotation works, use SAT.js offset to shift
    // the SAT points to the center before rotation is applied.
    this.setPivot(b.width / 2, b.height / 2);
    return this;
  }

  /**
   * Creates a SAT circle for the sprite. If there is an arcade body, it is used as reference for
   * the position and radius of the SAT body. If there is no arcade body, use the sprite as
   * reference for position and radius of the SAT body.
   * @returns {this}
   */
  initCircle() {
    this._bodyType = SatBody.BODY_TYPE.CIRCLE;
    const b = this._sprite.body ? this._sprite.body : this._sprite;
    const r = b.radius ? b.radius : b.width / 2;
    this._body = circle(vec(b.x, b.y), r);
    return this;
  }

  /**
   * Updates the radius for the SAT body. The (x, y) coordinates of the SAT body stay at the center
   * of the arcade body.
   * @param {float} radius New radius to use for the SAT body
   * @returns {this}
   */
  setCircleRadius(radius) {
    if (this._bodyType !== SatBody.BODY_TYPE.CIRCLE) return;
    this._body.r = radius;
    return this;
  }

  /**
   * Sets the pivot for the SAT box or polygon body. This is the (x, y) offset applied to the points
   * in the SAT body before any rotation is applied. This only applies to box and polygon bodies -
   * circles are always centered. Note: in the current implementation, the pivot is the same as the
   * anchor.
   * @param {float} x x position of pivot in pixels
   * @param {float} y y position of pivot in pixels
   * @returns {this}
   */
  setPivot(x, y) {
    this._body.setOffset(vec(-x, -y));
    return this;
  }

  getBody() {
    return this._body;
  }

  getBodyType() {
    return this._bodyType;
  }

  getAxisAlignedBounds() {
    let left = null;
    let right = null;
    let top = null;
    let bottom = null;
    if (this._bodyType === SatBody.BODY_TYPE.POLYGON || this._bodyType === SatBody.BODY_TYPE.BOX) {
      const points = this._body.calcPoints;
      for (let i = 0; i < points.length; i++) {
        const x = points[i].x + this._body.pos.x;
        const y = points[i].y + this._body.pos.y;
        if (left === null || x < left) left = x;
        if (right === null || x > right) right = x;
        if (top === null || y < top) top = y;
        if (bottom === null || y > bottom) bottom = y;
      }
    } else if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) {
      left = this._body.pos.x - this._body.r;
      right = this._body.pos.x + this._body.r;
      top = this._body.pos.y - this._body.r;
      bottom = this._body.pos.y + this._body.r;
    }
    // Return a rectangle representing the bounds
    return {
      x: left,
      y: top,
      width: right - left,
      height: bottom - top
    };
  }

  testOverlap(otherBody) {
    // Handy boolean shorthands
    const thisIsCircle = this._bodyType === SatBody.BODY_TYPE.CIRCLE;
    const otherIsCircle = otherBody._bodyType === SatBody.BODY_TYPE.CIRCLE;

    // Determine the appropriate collision body comparison
    if (thisIsCircle && otherIsCircle) {
      return SAT.testCircleCircle(this._body, otherBody._body);
    } else if (!thisIsCircle && otherIsCircle) {
      return SAT.testPolygonCircle(this._body, otherBody._body);
    } else if (thisIsCircle && !otherIsCircle) {
      return SAT.testPolygonCircle(otherBody._body, this._body);
    } else {
      return SAT.testPolygonPolygon(this._body, otherBody._body);
    }
  }

  testOverlapVsRectangle(rect) {
    // Convert rectangle to a SAT body
    const satRect = box(vec(rect.x, rect.y), rect.width, rect.height).toPolygon();
    return this.testOverlap(satRect);
  }

  collideVsRectangle(rect) {
    // Convert rectangle to a SAT body
    const satRect = box(vec(rect.x, rect.y), rect.width, rect.height).toPolygon();
    const response = new SAT.Response();

    // Determine the appropriate collision body comparison
    let isCollision;
    if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) {
      isCollision = SAT.testPolygonCircle(satRect, this._body, response);
    } else {
      isCollision = SAT.testPolygonPolygon(this._body, satRect, response);
    }

    if (isCollision) return response;
    else return false;
  }

  postUpdate() {
    // Update the position of the sat body differently based on whether an arcade body exists or
    // not.
    if (this._sprite.body) {
      // Update the body based on the latest arcade body physics
      this.updateFromArcadeBody();
    } else {
      // Update the body based on sprite position
      this.updateFromSprite();
    }
    // Check the sprite's body (or the sprite itself), to see if the scale has changed, and if so,
    // update the SAT body to match
    const b = this._sprite.body ? this._sprite.body : this._sprite;
    const newBodySize = { w: b.width, h: b.height };
    if (this._lastBodySize.w !== newBodySize.w || this._lastBodySize.h !== newBodySize.h) {
      this._lastBodySize = newBodySize;
      if (this._bodyType === SatBody.BODY_TYPE.BOX) this.initBox();
      else if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) this.initCircle();
      else this.initPolygon();
    }
    // Render is going to be called next, so update the debug
    if (this._isDebug) this._updateDebug();
  }

  /**
   * Updates the SAT body position and rotation based on the arcade body. This is called internally
   * by the plugin manager *but* may also need to be called manually. If the SAT body needs to be
   * up-to-date inside of a sprite's update function (e.g. for collisions), call this method.
   * Unfortunately, there is no hook in the Phaser lifecycle to call this method every time the
   * arcade body is updated (which happens in stage.preUpdate and in stage.postUpdate for arcade
   * physics).
   */
  updateFromArcadeBody() {
    // Update the position of the SAT body using the arcade body. Arcade bodies are positions are
    // relative to the top left of the body.
    const arcadeBody = this._sprite.body;
    if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) {
      // The arcade body position for a circle is anchored at the top left, but SAT circles are
      // anchored at the center, so shift the position.
      this._body.pos.x = arcadeBody.x + arcadeBody.width / 2;
      this._body.pos.y = arcadeBody.y + arcadeBody.height / 2;
    } else if (this._bodyType === SatBody.BODY_TYPE.BOX) {
      // The arcade body position for a rectangle is anchored at the top left. SAT boxes have their
      // pivot (and anchor) defined by the SAT body's offset property. This offset is applied in
      // SAT.js to ensure rotation happens around the right location. To place the SAT body, start
      // with the arcade body location and shift by the negative offset (because SAT is going to
      // apply the positive offset internally).
      this._body.pos.x = arcadeBody.x + -this._body.offset.x;
      this._body.pos.y = arcadeBody.y + -this._body.offset.y;
      this._body.setAngle(this._sprite.rotation); // MH: World rotation?
    } else if (this._bodyType === SatBody.BODY_TYPE.POLYGON) {
      // MH: Not yet sure what needs to happen here
      this._body.pos.x = arcadeBody.x + arcadeBody.halfWidth + -this._body.offset.x;
      this._body.pos.y = arcadeBody.y + arcadeBody.halfHeight + -this._body.offset.y;
      this._body.setAngle(this._sprite.rotation); // MH: World rotation?
    }
  }

  /**
   * Updates the SAT body position and rotation, based on the shape of the sat body and the position
   * of the sprite.
   */
  updateFromSprite() {
    // Update the position of the colliding body
    if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) {
      this._body.pos.x = this._sprite.world.x;
      this._body.pos.y = this._sprite.world.y;
    } else if (this._bodyType === SatBody.BODY_TYPE.BOX) {
      this._body.pos.x = this._sprite.world.x;
      this._body.pos.y = this._sprite.world.y;
      this._body.setAngle(this._sprite.rotation);
      // Rotation should probably be world rotation...or something?
    } else if (this._bodyType === SatBody.BODY_TYPE.POLYGON) {
      // MH: Not yet sure what needs to happen here
      this._body.pos.x = this._sprite.world.x;
      this._body.pos.y = this._sprite.world.y;
      this._body.setAngle(this._sprite.rotation);
      // Rotation should probably be world rotation...or something?
    }

    if (this._isDebug) this._updateDebug();
  }

  destroy() {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this._plugin.removeBody(this);
  }

  /**
   * @returns {SatBody} Returns the SatBody for chaining
   */
  setDebugColor(debugColor) {
    this._debugColor = debugColor;
    return this;
  }

  /**
   * @returns {SatBody} Returns the SatBody for chaining
   */
  enableDebug(debugColor = 0x00ff00) {
    this._isDebug = true;
    if (!this._debugGraphics) {
      // Only create debug graphics if it is needed, for performance reasons
      this._debugGraphics = this.game.add.graphics(0, 0);
      if (this._sprite.parent) this._sprite.parent.add(this._debugGraphics);
    }
    this._debugGraphics.visible = true;
    this.setDebugColor(debugColor);
    return this;
  }

  /**
   * @returns {SatBody} Returns the SatBody for chaining
   */
  disableDebug() {
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
    return this;
  }

  _updateDebug() {
    this._debugGraphics.position.copyFrom(this._body.pos);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, this._debugColor, 0.8);
    this._debugGraphics.beginFill(this._debugColor, 0.6);
    this._debugGraphics.drawCircle(0, 0, 1); // Center
    if (this._bodyType === SatBody.BODY_TYPE.CIRCLE) {
      this._debugGraphics.drawCircle(0, 0, 2 * this._body.r);
    } else if (
      this._bodyType === SatBody.BODY_TYPE.POLYGON ||
      this._bodyType === SatBody.BODY_TYPE.BOX
    ) {
      // The calcPoints are the polygon's points with offset and rotation applied but without the
      // pos applied
      this._debugGraphics.drawPolygon(this._body.calcPoints);
    }
    this._debugGraphics.endFill();
  }
}
