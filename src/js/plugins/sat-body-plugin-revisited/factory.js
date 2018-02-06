import Body from "./body";

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
}
