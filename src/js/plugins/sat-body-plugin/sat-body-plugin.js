import SatBody from "./sat-body.js";

export default class SatBodyPlugin extends Phaser.Plugin {
  constructor(game, pluginManager) {
    super(game, pluginManager);
    this.game = game;
    this.pluginManager = pluginManager;
    this._bodies = [];
    this._isDebug = false;
  }

  /**
   * Creates a SAT box for the sprite based on an underlying arcade body. The SAT body is placed at
   * the position of the body and given a width and height that match the body. See SatBody:initBox.
   * 
   * @param {Sprite} sprite The sprite to add the body to 
   * @returns {SatBody}
   */
  addBoxBody(sprite) {
    const body = new SatBody(this, sprite).initBox();
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
  }

  /**
   * Creates a SAT circle for the sprite based on an underlying arcade body. The SAT body is placed
   * at the position of the body and given a radius that matches the body. See SatBody:initCircle.
   * 
   * @param {Sprite} sprite The sprite to add the body to
   * @returns {SatBody}
   */
  addCircleBody(sprite) {
    const body = new SatBody(this, sprite).initCircle();
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
  }

  /**
   * Creates a SAT polygon for the sprite based on an array of points. See SatBody:initPolygon.
   *
   * @param {Sprite} sprite The sprite to add the body to
   * @returns {SatBody}
   */
  addPolygonBody(sprite, points) {
    const body = new SatBody(this, sprite).initPolygon(points);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
  }

  isDebugAllEnabled() {
    return this._isDebug === true;
  }

  enableDebugAll() {
    this._isDebug = true;
    this._bodies.forEach(body => body.enableDebug());
  }

  disableDebugAll() {
    this._isDebug = false;
    this._bodies.forEach(body => body.disableDebug());
  }

  /** 
   * Update the SAT bodies after the final arcade physics calculations are run (which happens in
   * stage.postUpdate). This is automatically called by the plugin manager. See
   * Phaser/core/Game#updateLogic for the lifecycle.
   */
  postUpdate() {
    this._bodies.forEach(body => body.postUpdate());
  }

  removeBody(bodyToRemove) {
    this._bodies = this._bodies.filter(body => body !== bodyToRemove);
  }

  destroy() {
    this._bodies.forEach(body => body.destroy());
  }
}
