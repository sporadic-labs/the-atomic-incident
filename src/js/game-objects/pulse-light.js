module.exports = PulseLight;

var utils = require("../helpers/utilities.js");

// Prototype chain - inherits from Sprite
PulseLight.prototype = Object.create(Phaser.Sprite.prototype);

function PulseLight(game, x, y, parentGroup, radius, color, delay) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this.delay = delay;

    this._lighting = game.globals.plugins.lighting;

    this.radius = radius;
    this.light = this._lighting.addLight(
        new Phaser.Point(x, y),
        new Phaser.Circle(0, 0, radius * 2), 
        color);
    // Turn light off by default
    this.light.enabled = false;

    // Create a timer for turning the light on/off
    this._timer = this.game.time.create(false);
    this._timer.start();
    // Pulse after the lighting system has had a chance to update once
    setTimeout(this._pulse.bind(this), 0);

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);
}

PulseLight.prototype.drop = function (position) {
    this._placed = true;
    this.position.copyFrom(position)
    this.light.position.copyFrom(position)
};

PulseLight.prototype._pulse = function () {
    this.light.enabled = !this.light.enabled;
    setTimeout(this._pulse.bind(this), this.delay);
}

PulseLight.prototype.update = function () {
    // Update the health
    this.health -= this._decayRate * this.game.time.physicsElapsed;
    if (this.health <= 0) this.health = 0; 
    // Update the radius based on the health
    this.radius = (this.health / this.originalHealth) * this.originalRadius;
    this.light.radius = this.radius;
    // Update the position if being carried
    if (this._beingCarried) {
        this.position.copyFrom(this._carrier.position);
    }
    this.light.position.copyFrom(this.position);
};

PulseLight.prototype.destroy = function () {
    this._timer.destroy();
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};