export default class Collider {
  // Options: onCollide, context, separate
  constructor(world, object1, object2, options) {
    this.world = world;

    this.object1 = object1;
    this.object2 = object2;
    this.options = options;
  }

  update() {
    this.world.collide(this.object1, this.object2, this.options);
  }

  destroy() {
    this.world.removeCollider(this);
  }
}
