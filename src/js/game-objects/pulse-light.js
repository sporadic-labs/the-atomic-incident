module.exports = PulseLight;

var spriteUtils = require("../helpers/sprite-utilities.js");

// Prototype chain - inherits from Sprite
PulseLight.prototype = Object.create(Phaser.Sprite.prototype);

function PulseLight(game, x, y, parentGroup, radius, value, color, delay) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this.game = game;
    this.delay = delay;
    this.damage = 20; // Damage per second
    this.color = color;
    this.value = value; // Cost for the tower

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

PulseLight.prototype._pulse = function () {
    if (this.isLightOn) {
        this.tweenTint(this.light, 0xB0EBFF, 0x000000, this.delay*0.9);
    } else if (!this.isLightOn) {
        this.tweenTint(this.light, 0x000000, 0xB0EBFF, this.delay*0.9);
    }
    this.pulseTimer = setTimeout(this._pulse.bind(this), this.delay);
}

PulseLight.prototype.update = function () {
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

PulseLight.prototype.destroy = function () {
    clearTimeout(this.pulseTimer);
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

// Thanks lewster32
// Source: http://www.html5gamedevs.com/topic/7162-tweening-a-tint/
PulseLight.prototype.tweenTint = function(obj, startColor, endColor, time) {
    // create an object to tween with our step value at 0
    var colorBlend = { step: 0 };
    // create the tween on this object and tween its step property to 100
    var colorTween = this.game.add.tween(colorBlend).to({step: 100}, time);
    // run the interpolateColor function every time the tween updates, feeding it the
    // updated value of our tween each time, and set the result as our tint
    colorTween.onUpdateCallback(function() {
        obj.color = Phaser.Color.interpolateColor(startColor, endColor, 100, colorBlend.step);
    });
    colorTween.onComplete.add(function() {
        this.isLightOn = !this.isLightOn;
    }, this);

    // set the object to the start color straight away
    obj.color = startColor;
    // start the tween
    colorTween.start();
};