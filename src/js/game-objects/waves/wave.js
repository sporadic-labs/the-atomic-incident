export default class Wave {
  /**
   * Creates an instance of Wave.
   * @param {Phaser.Game} game 
   * 
   * @memberof Wave
   */
  constructor(game) {
    this.game = game;
    this.composition = null;
    this._mapManager = game.globals.mapManager;
    this._enemies = game.globals.groups.enemies;
  }

  /** 
   * @param {WaveComposition} composition The composition to use when spawning
   * 
   * @memberof Wave
   */
  // eslint-disable-next-line no-unused-vars
  spawn(composition) {
    // Subclasses should implement spawn!
  }

  destroy() {
    // Subclass should implement destroy!
  }
}
