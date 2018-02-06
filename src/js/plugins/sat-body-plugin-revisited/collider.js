export default class Collider {
  constructor(
    world,
    object1,
    object2,
    { overlapOnly = false, collideCallback, processCallback, callbackContext } = {}
  ) {
    this.world = world;

    this.object1 = object1;
    this.object2 = object2;

    this.overlapOnly = overlapOnly;

    this.collideCallback = collideCallback;
    this.processCallback = processCallback;
    this.callbackContext = callbackContext;
  }

  update() {
    this.world.collide(
      this.object1,
      this.object2,
      this.collideCallback,
      this.processCallback,
      this.callbackContext,
      this.overlapOnly
    );
  }

  destroy() {
    this.world.removeCollider(this);
  }
}
