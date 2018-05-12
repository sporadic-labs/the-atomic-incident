import BODY_SHAPES from "./body-shapes";
import BODY_TYPES from "./body-types";
import { vec, circle, box, polygon } from "./sat-factories";
import logger from "../../helpers/logger";

const P = Phaser.Point;
const applyDefault = (value, defaultValue) => (value !== undefined ? value : defaultValue);

export default class Body {
  constructor(
    world,
    { bodyType = BODY_TYPES.DYNAMIC, gameObject, shape = "rectangle", debugSettings = {} } = {}
  ) {
    this.world = world;
    this.game = this.world.game;
    this.satPlugin = world.satPlugin;
    this.bodyType = bodyType;
    this.debugSettings = {
      fillColor: applyDefault(debugSettings.fillColor, 0xcb00e6),
      strokeColor: applyDefault(debugSettings.fillColor, 0xcb00e6),
      strokeWidth: applyDefault(debugSettings.fillColor, 2),
      centerColor: applyDefault(debugSettings.fillColor, 0xcb00e6),
      alpha: applyDefault(debugSettings.fillColor, 0.5)
    };

    // Property to allow for fast duck type checking over slower instance of check
    this.isSatBody = true;

    // A disabled body will not update it's position or be checked for collisions
    this.enabled = true;

    // Offset of the SAT body from this.position
    this.offset = new Phaser.Point(0, 0);

    this.position = gameObject ? gameObject.position.clone() : new P(0, 0);
    this.previousPosition = this.position.clone();
    this.rotation = gameObject ? gameObject.rotation : 0;
    this.previousRotation = this.rotation;
    this.velocity = new P(0, 0);
    this.acceleration = new P(0, 0);
    this.angularVelocity = 0;
    this.bounce = 0;
    this.maxSpeed = null;
    this.mass = 1;

    // A flag to prevent collisions from altering a body's velocity. This is useful if a sprite is
    // controlled by the player and shouldn't get caught on corners.
    this.collisionAffectsVelocity = true;

    // If the body is moving, this will be its angular heading
    this.heading = 0;

    // A number between 0 and 1 which determines how quickly the velocity falls to zero. With a
    // value of 1, velocity will drop to zero instantly.
    this.drag = 0;

    // Bounding box read-only properties that are updated when the body is changed.
    this.width = 0;
    this.height = 0;
    this.left = 0;
    this.right = 0;
    this.top = 0;
    this.bottom = 0;

    // Single body per GO that destroys itself when the GO is destroyed
    this.gameObject = gameObject;
    if (gameObject) {
      if (gameObject.body) gameObject.body.destroy();
      gameObject.body = this;
      gameObject.events.onDestroy.add(() => this.destroy());
    }

    this.satBody;
    this.setShape(shape);

    // TODO features
    // - friction (number)
    // - angular velocity (number)
    // - max angular speed (number)
    // - angular drag (number)
    // - fixed rotation (boolean)
    // - moves (boolean) - see phaser v2, allows user to control body movement while still colliding
    // - store original SAT body to allow for rotations and optimizing collision/bound checks
    // - compound SAT bodies
    // - torque
    // - world bounce (number)
    // - sensor
  }

  // Supported formats:
  // "rectangle",
  // "circle",
  // { type: "rectangle", width: 50, height: 50 }
  // { type: "circle", radius: 50  }
  // { type: "polygon", points: []  }
  setShape(shape) {
    if (typeof shape === "string") shape = { type: shape };
    const type = shape.type.toLowerCase();
    if (type === "rectangle") {
      this.setRectangle(shape.width, shape.height);
    } else if (type === "circle") {
      this.setCircle(shape.radius);
    } else if (type === "polygon") {
      this.setPolygon(shape.points);
    } else {
      logger.warn(`Invalid shape name: ${shape.type}.`);
    }
    return this;
  }

  // Top left is at gameObject.position
  setRectangle(width, height) {
    if (width === undefined && this.gameObject) width = this.gameObject.width;
    if (height === undefined && this.gameObject) height = this.gameObject.height;
    this.bodyShape = BODY_SHAPES.RECTANGLE;
    this.originalSatBody = box(vec(0, 0), width, height);
    this.satBody = this.originalSatBody.toPolygon();
    this.updateSatBodyPosition();
    this.updateBounds();
    return this;
  }

  // Center is at gameObject.position
  setCircle(radius) {
    if (radius === undefined && this.gameObject) radius = this.gameObject.width / 2;
    this.bodyShape = BODY_SHAPES.CIRCLE;
    this.satBody = circle(vec(0, 0), radius);
    this.updateSatBodyPosition();
    this.updateBounds();
    return this;
  }

  // Points are relative to gameObject.position
  setPolygon(points) {
    this.bodyShape = BODY_SHAPES.POLYGON;
    this.satBody = polygon(vec(0, 0), points.map(p => vec(p.x, p.y)));
    this.updateSatBodyPosition();
    this.updateBounds();
    return this;
  }

  setOffset(x, y) {
    if (this.bodyShape === BODY_SHAPES.CIRCLE) this.offset.setTo(x, y);
    else this.satBody.setOffset(vec(x, y));
    return this;
  }

  setRotation(radians) {
    if (this.bodyShape !== BODY_SHAPES.CIRCLE) this.satBody.setAngle(radians);
  }

  setPosition(x, y) {
    this.position.setTo(x, y);
    this.updateSatBodyPosition();
    return this;
  }

  setVelocity(x, y) {
    this.velocity.setTo(x, y);
    return this;
  }

  setBounce(bounce) {
    this.bounce = bounce;
    return this;
  }

  setDrag(drag) {
    this.drag = drag;
    return this;
  }

  setMaxSpeed(maxSpeed) {
    this.maxSpeed = Math.max(maxSpeed, 0);
    return this;
  }

  copyPosition(obj) {
    this.setPosition(obj.x, obj.y);
    return this;
  }

  // If driven by Sprite, this is called by the Sprite, before Sprite's preUpdate in
  // gameobjects/Sprite.js
  preUpdate() {
    // TODO: copy scale

    if (!this.enabled || this.bodyType === BODY_TYPES.STATIC) return;

    const delta = this.game.time.physicsElapsed;

    this.previousPosition.copyFrom(this.position);
    this.previousRotation = this.rotation;

    if (this.gameObject) {
      const obj = this.gameObject;

      this.rotation = obj.rotation;
      this.previousRotation = this.rotation;

      this.position.x = obj.world.x + obj.scale.x * this.offset.x;
      this.position.x -= obj.scale.x < 0 ? this.width : 0;

      this.position.y = obj.world.y + obj.scale.y * this.offset.y;
      this.position.y -= obj.scale.y < 0 ? this.width : 0;
    }

    // Update forces
    if (!this.world.gravity.isZero()) {
      this.velocity.x += this.world.gravity.x * delta;
      this.velocity.y += this.world.gravity.y * delta;
    }
    if (!this.acceleration.isZero()) {
      this.velocity.x += this.acceleration.x * delta;
      this.velocity.y += this.acceleration.y * delta;
    }
    if (this.drag !== 0) {
      // https://stackoverflow.com/questions/14013248/damping-velocity-with-deltatime
      const factor = Math.pow(1 - this.drag, delta);
      this.velocity.x *= factor;
      this.velocity.y *= factor;
    }

    // Enforce max speed only if the user has set it
    if (this.maxSpeed !== null) {
      if (this.velocity.getMagnitude() > this.maxSpeed) this.velocity.setMagnitude(this.maxSpeed);
    }

    // Apply movement
    this.position.x += this.velocity.x * delta;
    this.position.y += this.velocity.y * delta;

    // Update angular position
    this.rotation += this.angularVelocity * delta;

    // Update heading
    if (!this.velocity.isZero()) this.heading = Math.atan2(this.velocity.y, this.velocity.x);

    this.updateSatBodyPosition();
    this.updateBounds();

    this.setRotation(this.rotation);
  }

  // If driven by Sprite, this is called by Sprite, in component/core.js postUpdate
  postUpdate() {
    if (!this.enabled || this.bodyType === BODY_TYPES.STATIC) return;

    if (this.gameObject) {
      this.gameObject.position.x = this.position.x;
      this.gameObject.position.y = this.position.y;

      // Apply delta rotation in order to allow rotation to be set manually in Sprite#update, which
      // is in-between the body's preUpdate and postUpdate
      this.gameObject.rotation += this.rotation - this.previousRotation;
    }
  }

  updateSatBodyPosition() {
    this.satBody.pos.x = this.offset.x + this.position.x;
    this.satBody.pos.y = this.offset.y + this.position.y;
  }

  updateBounds() {
    let left, right, top, bottom;

    if (this.bodyShape === BODY_SHAPES.POLYGON || this.bodyShape === BODY_SHAPES.RECTANGLE) {
      this.satBody.calcPoints.forEach(p => {
        const x = p.x + this.satBody.pos.x;
        const y = p.y + this.satBody.pos.y;
        if (left === undefined || x < left) left = x;
        if (right === undefined || x > right) right = x;
        if (top === undefined || y < top) top = y;
        if (bottom === undefined || y > bottom) bottom = y;
      });
    } else if (this.bodyShape === BODY_SHAPES.CIRCLE) {
      left = this.satBody.pos.x - this.satBody.r;
      right = this.satBody.pos.x + this.satBody.r;
      top = this.satBody.pos.y - this.satBody.r;
      bottom = this.satBody.pos.y + this.satBody.r;
    }

    this.left = left;
    this.right = right;
    this.top = top;
    this.bottom = bottom;
    this.width = this.right - this.left;
    this.height = this.bottom - this.top;

    return this;
  }

  drawDebug(graphics) {
    const { strokeWidth, strokeColor, fillColor, centerColor, alpha } = this.debugSettings;
    const satBody = this.satBody;
    const pos = satBody.pos;

    if (centerColor) {
      graphics.lineStyle(0);
      graphics.beginFill(centerColor, alpha);
      graphics.drawEllipse(pos.x, pos.y, 4, 4);
      graphics.endFill();
    }
    if (strokeColor && strokeWidth > 0) {
      graphics.lineStyle(strokeWidth, strokeColor, alpha);
    }
    if (fillColor) graphics.beginFill(fillColor, alpha);

    if (this.bodyShape === BODY_SHAPES.RECTANGLE || this.bodyShape === BODY_SHAPES.POLYGON) {
      const points = this.satBody.calcPoints.map(p => ({
        x: p.x + pos.x,
        y: p.y + pos.y
      }));
      graphics.drawShape(new Phaser.Polygon(...points));
    } else if (this.bodyShape === BODY_SHAPES.CIRCLE) {
      const d = 2 * this.satBody.r;
      graphics.drawCircle(pos.x, pos.y, d);
    }

    if (fillColor) graphics.endFill();
  }

  destroy() {
    this.game = null;
    this.world.remove(this);
    if (this.gameObject && this.gameObject.body === this) this.gameObject.body = null;
    this.gameObject = null;
  }
}
