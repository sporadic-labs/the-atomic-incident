import World from "./world";
import Factory from "./factory";

export default class SatBodyPlugin extends Phaser.Plugin {
  constructor(game, pluginManager) {
    super(game, pluginManager);
    this.game = game;
    this.pluginManager = pluginManager;
  }

  init(options) {
    // TODO: use options to configure the world
    this.world = new World(this.game, this);
    this.factory = new Factory(this.world);

    // Finish injecting into the Physics stucture. We don't necessarily need to hook into it, since
    // all the world update calls are invoked by the plugin and body update calls are invoked by
    // sprites
    Phaser.Physics.SAT = 10;
    this.game.physics.sat = {
      add: this.factory,
      world: this.world
    };
  }

  preUpdate() {
    this.world.preUpdate();
  }

  update() {
    this.world.update();
  }

  postUpdate() {
    this.world.postUpdate();
  }

  destroy() {
    this.world.destroy();
  }
}
