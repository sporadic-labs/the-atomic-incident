module.exports = PulseLight;

var utils = require("../helpers/utilities.js");
var spriteUtils = require("../helpers/sprite-utilities.js");

// Prototype chain - inherits from Sprite
PulseLight.prototype = Object.create(Phaser.Sprite.prototype);

function PulseLight(game, x, y, parentGroup, radius, color, delay) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this.game = game;
    this.delay = delay;
    this.damage = 20; // Damage per second
    this.color = color;

    this._lighting = game.globals.plugins.lighting;

    this.radius = radius;
    this.light = this._lighting.addLight(
        new Phaser.Point(x, y),
        new Phaser.Circle(0, 0, radius * 2), 
        color);
    // Turn light on by default
    this.isLightOn = true;

    // Create a timer for turning the light on/off
    this._timer = this.game.time.create(false);
    this._timer.start();
    // Pulse after the lighting system has had a chance to update once
    this.pulseTimer = setTimeout(this._pulse.bind(this), 0);

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
    if (this.isLightOn) {
        this.light.switchOff(this.delay);
        this.isLightOn = !this.isLightOn;
    } else if (!this.isLightOn) {
        this.light.switchOn(this.delay, this.color);
        this.isLightOn = !this.isLightOn;
    }
    this.pulseTimer = setTimeout(this._pulse.bind(this), this.delay);
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
    // Damage enemies
    var enemies = this.game.globals.groups.enemies;
    var damage = this.damage * this.game.time.physicsElapsed;
    spriteUtils.forEachRecursive(enemies, function (enemy) {
        var inLight = this.light.isPointInLight(enemy.worldPosition);
        if (inLight) enemy.takeDamage(damage);
    }, this);
};

PulseLight.prototype.destroy = function () {
    clearTimeout(this.pulseTimer);
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};