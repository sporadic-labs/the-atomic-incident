import Body from "./body";
import Collider from "./collider";
import BODY_TYPES from "./body-types";

export default class Factory {
  constructor(world) {
    this.game = world.game;
    this.world = world;
  }

  body(options) {
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  staticBody(options = {}) {
    options.bodyType = BODY_TYPES.STATIC;
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  gameObject(gameObject, options = {}) {
    options.gameObject = gameObject;
    const body = new Body(this.world, options);
    this.world.add(body);
    return body;
  }

  collider(object1, object2, options) {
    const collider = new Collider(this.world, object1, object2, options);
    this.world.addCollider(collider);
    return collider;
  }

  overlap(object1, object2, options = {}) {
    options.separate = false;
    return this.collider(object1, object2, options);
  }
}
