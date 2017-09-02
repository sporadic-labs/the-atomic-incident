module.exports = CarriableLight;

var utils = require("../helpers/utilities.js");

// Prototype chain - inherits from Sprite
CarriableLight.prototype = Object.create(Phaser.Sprite.prototype);

function CarriableLight(game, x, y, parentGroup, radius, color, health) {
  Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
  this.anchor.set(0.5);
  parentGroup.add(this);
  var c = Phaser.Color.valueToColor(color);
  this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

  this._lighting = game.globals.plugins.lighting;

  this.originalRadius = this.radius = radius;
  this.originalHealth = this.health = utils.default(health, 100);
  this._decayRate = 3; // Health per second
  this.light = this._lighting.addLight(new Phaser.Point(x, y), radius, color);

  game.physics.arcade.enable(this);
  this.body.immovable = true;
  this.body.setCircle(this.width / 2);
}

CarriableLight.prototype.pickUp = function(carrier) {
  this._carrier = carrier;
  this._beingCarried = true;

  // If light was in a charging station, stop the charge
  if (this._station) {
    this._station.stopCharge();
    this._station = null;
  }
};

CarriableLight.prototype.drop = function() {
  this._carrier = null;
  this._beingCarried = false;

  // Body is out of date since it hasn't been updating
  // this.body.position = Phaser.Point.add(
  //     this.game.globals.player.body.position,
  //     this.body.offset
  // );

  // Check for an overlapping charging station
  var arcade = this.game.physics.arcade;
  var stations = this.game.globals.groups.chargingStations;
  stations.forEach(function(station) {
    if (arcade.intersects(station.body, this.body)) {
      station.startCharge(this);
      this._station = station;
      // Snap position to the charging station
      this.position.copyFrom(this._station.position);
    }
  }, this);

  // Drop the light somewhere in front of where the player is currently
  // looking (if the light wasn't just placed in a station)
  // MH: maybe this isn't the thing to do, since it blocks the player's
  // movement
  if (!this._station) {
    var player = this.game.globals.player;
    // Offset in the direction of the player rotation
    var offset = new Phaser.Point(
      Math.cos(player.rotation - Math.PI / 2) * player.width * 0.8,
      Math.sin(player.rotation - Math.PI / 2) * player.height * 0.8
    );
    this.position = Phaser.Point.add(player.position, offset);
  }
};

CarriableLight.prototype.update = function() {
  // Update the health
  this.health -= this._decayRate * this.game.time.physicsElapsed;
  if (this.health <= 0) this.health = 0;
  // Update the radius based on the health
  this.radius = this.health / this.originalHealth * this.originalRadius;
  this.light.radius = this.radius;
  // Update the position if being carried
  if (this._beingCarried) {
    this.position.copyFrom(this._carrier.position);
  }
  this.light.position.copyFrom(this.position);
};

CarriableLight.prototype.destroy = function() {
  this.light.destroy();
  Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
