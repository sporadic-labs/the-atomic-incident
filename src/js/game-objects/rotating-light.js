module.exports = RotatingLight;

var spriteUtils = require("../helpers/sprite-utilities.js");

// Prototype chain - inherits from Sprite
RotatingLight.prototype = Object.create(Phaser.Sprite.prototype);

function RotatingLight(game, x, y, parentGroup, radius, value, color) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this.game = game;
    this.damage = 60; // Damage per second
    this.value = value; // Cost for the tower

    this._lighting = game.globals.plugins.lighting;

    // Generate a flashlight shaped polygon
    var lightOrientation = -90 * Math.PI / 180;
    var lightArcAngle = 60 * Math.PI / 180;
    var arcSamples = 6;
    var lightPoints = [new Phaser.Point(0, 0)];
    var lightRange = 250;
    for (var i = 0; i <= arcSamples; i += 1) {
        var percent = (i / arcSamples)
        var currentAngle = (lightArcAngle / 2) - (lightArcAngle * percent);
        lightPoints.push(new Phaser.Point(
            Math.cos(lightOrientation + currentAngle) * lightRange,
            Math.sin(lightOrientation + currentAngle) * lightRange
        ));
    }
    var polygon = new Phaser.Polygon(lightPoints);
    this.light = this._lighting.addLight(
        new Phaser.Point(x, y), polygon, color);

    // Create a timer for turning the light on/off
    this._timer = this.game.time.create(false);
    this._timer.start();

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);
}

RotatingLight.prototype.update = function () {
    this.light.rotation += Math.PI/100;
    // Damage enemies
    var enemies = this.game.globals.groups.enemies;
    var damage = this.damage * this.game.time.physicsElapsed;
    spriteUtils.forEachRecursive(enemies, function (child) {
        if (child instanceof Phaser.Sprite && child.takeDamage) {
            // MH: why does world position not work here...
            var inLight = this.light.isPointInLight(child.position);
            if (inLight) {
                child.takeDamage(damage);
            }
        }
    }, this);
};

RotatingLight.prototype.destroy = function () {
    this._timer.destroy();
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};