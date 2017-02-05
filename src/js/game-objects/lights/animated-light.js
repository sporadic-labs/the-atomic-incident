module.exports = AnimatedLight;

var Light = require("../../plugins/lighting-plugin/light.js");
var lightUtils = require("./light-utilities");

/**
 * A class for representing an animated light. This cleans up after itself by 
 * destroying its own tweens and any tweens on targets that have been 
 * registered.
 */
function AnimatedLight(game, parent, position, shape, color) {
    Light.call(this, game, parent, position, shape, color);
    game.globals.plugins.lighting.addExistingLight(this);
    this._tweenTargets = []
}

AnimatedLight.prototype = Object.create(Light.prototype);

AnimatedLight.prototype.addTweenTarget = function (target) {
    this._tweenTargets.push(target);
};

AnimatedLight.prototype.destroy = function () {
    this.game.tweens.removeFrom(this);
    for (var i = 0; i < this._tweenTargets.length; i++) {
        this.game.tweens.removeFrom(this._tweenTargets[i]);
    }
    Light.prototype.destroy.apply(this);
};

/**
 * A static method for creating a light that pulses on and off
 * @static
 */
AnimatedLight.createPulsingCircle = function (game, position, shape, color, 
        pulseTime) {
    var lighting = game.globals.plugins.lighting;
    var light = new AnimatedLight(game, lighting.parent, position, shape, 
            color);

    // Tween setup
    light.addTweenTarget(light.color);

    // Yoyo'ing and repeating tween to fade the light in and out
    game.add.tween(light.color)
        .to({a: 0}, pulseTime, "Linear", true)
        .repeat(-1).yoyo(true);
    
    return light;
};

/**
 * A static method for creating a rotating spotlight
 * @static
 */
AnimatedLight.createContractingCircle = function (game, position, shape, color, 
        duration) {
    var lighting = game.globals.plugins.lighting;
    var light = new AnimatedLight(game, lighting.parent, position, shape, 
            color);

    // Yoyo'ing and repeating tween to fade the light in and out
    game.add.tween(light.shape)
        .to({radius: 0}, duration, "Linear", true)
        .repeat(-1).yoyo(true);
    
    return light;
};

/**
 * A static method for creating a rotating spotlight
 * @static
 */
AnimatedLight.createRotatingSpotlight = function (game, position, 
        orientation, span, range, color, rotationSpeed) {
    var lighting = game.globals.plugins.lighting;
    var polygon = lightUtils.generateSpotlightPolygon(orientation, span, range);
    var light = new AnimatedLight(game, lighting.parent, position, polygon, 
            color);

    // Repeating tween to rotate the light
    var duration = 360 / rotationSpeed * 1000;
    game.add.tween(light)
        .to({rotation: 2 * Math.PI}, duration, "Linear", true)
        .repeat(-1).start();
    
    return light;
};