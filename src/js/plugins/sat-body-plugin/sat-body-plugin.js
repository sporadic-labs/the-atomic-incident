import SatBody from "./sat-body.js";

Phaser.Plugin.SatBody = function(game, parent) {
  this.game = game;
  this.parent = parent;
  this._bodies = [];
  this._isDebug = false;
};

Phaser.Plugin.SatBody.prototype = Object.create(Phaser.Plugin.prototype);

/**
 * Creates a SAT box for the sprite based on an underlying arcade body. The
 * SAT body is placed at the position of the body and given a width and height
 * that match the body. See SatBody:initBox.
 * 
 * @param {Sprite} sprite The sprite to add the body to 
 * @returns {SatBody}
 */
Phaser.Plugin.SatBody.prototype.addBoxBody = function(sprite) {
  const body = new SatBody(sprite).initBox();
  if (this._isDebug) body.enableDebug();
  this._bodies.push(body);
  return body;
};

/**
 * Creates a SAT circle for the sprite based on an underlying arcade body. The
 * SAT body is placed at the position of the body and given a radius that 
 * matches the body. See SatBody:initCircle.
 * 
 * @param {Sprite} sprite The sprite to add the body to
 * @returns {SatBody}
 */
Phaser.Plugin.SatBody.prototype.addCircleBody = function(sprite) {
  const body = new SatBody(sprite).initCircle();
  if (this._isDebug) body.enableDebug();
  this._bodies.push(body);
  return body;
};

/**
 * Creates a SAT polygon for the sprite based on an array of points. See
 * SatBody:initPolygon.
 *
 * @param {Sprite} sprite The sprite to add the body to
 * @returns {SatBody}
 */
Phaser.Plugin.SatBody.prototype.addPolygonBody = function(sprite, points) {
  const body = new SatBody(sprite).initPolygon(points);
  if (this._isDebug) body.enableDebug();
  this._bodies.push(body);
  return body;
};

Phaser.Plugin.SatBody.prototype.isDebugAllEnabled = function() {
  return this._isDebug === true;
};

Phaser.Plugin.SatBody.prototype.enableDebugAll = function() {
  this._isDebug = true;
  for (let i = 0; i < this._bodies.length; i += 1) {
    this._bodies[i].enableDebug();
  }
};

Phaser.Plugin.SatBody.prototype.disableDebugAll = function() {
  this._isDebug = false;
  for (let i = 0; i < this._bodies.length; i += 1) {
    this._bodies[i].disableDebug();
  }
};

/** 
 * Update the SAT bodies after the final arcade physics calculations are run (
 * which happens in stage.postUpdate). This is automatically called by the 
 * plugin manager. See Phaser/core/Game#updateLogic for the lifecycle.
 */
Phaser.Plugin.SatBody.prototype.postUpdate = function() {
  for (let i = 0; i < this._bodies.length; i += 1) {
    this._bodies[i].postUpdate();
  }
};

Phaser.Plugin.SatBody.prototype.removeBody = function(body) {
  for (let i = 0; i < this._bodies.length; i += 1) {
    if (body === this._bodies[i]) {
      this._bodies.splice(i, 1);
      break;
    }
  }
};

Phaser.Plugin.SatBody.prototype.destroy = function() {
  for (let i = 0; i < this._bodies.length; i += 1) {
    this._bodies[i].destroy();
  }
};

export default Phaser.Plugin.SatBody;
