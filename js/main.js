(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Player;

var Controller = require("../helpers/controller.js");

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player");
    this.anchor.set(0.5);
    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    // Configure player physics
    this._maxSpeed = 500;
    this._maxAcceleration = 10000;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setSize(36, 36);
    this.body.drag.set(this._maxDrag, this._maxDrag);

    // Player controls
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    this._controls.addKeyboardControl("up", [Kb.W, Kb.UP]);
    this._controls.addKeyboardControl("left", [Kb.A, Kb.LEFT]);
    this._controls.addKeyboardControl("right", [Kb.D, Kb.RIGHT]);
    this._controls.addKeyboardControl("down", [Kb.S, Kb.DOWN]);
}

Player.prototype.update = function () {
    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    if (this._controls.isControlActive("left")) acceleration.x = -1;
    else if (this._controls.isControlActive("right")) acceleration.x = 1;
    if (this._controls.isControlActive("up")) acceleration.y = -1;
    else if (this._controls.isControlActive("down")) acceleration.y = 1;

    // Normalize the acceleration and set the magnitude. This makes it so that
    // the player moves in the same speed in all directions.
    acceleration = acceleration.setMagnitude(this._maxAcceleration);
    this.body.acceleration.copyFrom(acceleration);

    // Cap the velocity. Phaser physics's max velocity caps the velocity in the
    // x & y dimensions separately. This allows the sprite to move faster along
    // a diagonal than it would along the x or y axis. To fix that, we need to
    // cap the velocity based on it's magnitude.
    if (this.body.velocity.getMagnitude() > this._maxSpeed) {
        this.body.velocity.setMagnitude(this._maxSpeed);
    }
};
},{"../helpers/controller.js":3}],2:[function(require,module,exports){
module.exports = SeekerEnemy;

// Prototype chain - inherits from Sprite
SeekerEnemy.prototype = Object.create(Phaser.Sprite.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy; // Make sure constructor reads properly

function SeekerEnemy(game, x, y, target, parentGroup) {
    Phaser.Sprite.call(this, game, x, y, "assets", "player");
    this.scale.set(0.75);
    this.anchor.set(0.5);
    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    // Give the sprite a random tint
    var randLightness = this.game.rnd.realInRange(0.4, 0.6);
    var rgb = Phaser.Color.HSLtoRGB(0.98, 1, randLightness);
    this.tint = Phaser.Color.getColor(rgb.r, rgb.g, rgb.b);

    this._target = target;
    this._visionRadius = 300;

    // Configure player physics
    this._maxSpeed = 200;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setSize(36, 36);
    this.body.drag.set(this._maxDrag, this._maxDrag);
}

/**
 * Override preUpdate to update velocity. Physics updates happen in preUpdate,
 * so if the velocity updates happened AFTER that, the targeting would be off
 * by a frame.
 */
SeekerEnemy.prototype.preUpdate = function () {
    this.body.velocity.set(0);

    // Check if target is within visual range
    var distance = this.position.distance(this._target.position);
    if (distance <= this._visionRadius) {
        // If target is in range, calculate the acceleration based on the 
        // direction this sprite needs to travel to hit the target
        var angle = this.position.angle(this._target.position);
        var targetSpeed = distance / this.game.time.physicsElapsed;
        var magnitude = Math.min(this._maxSpeed, targetSpeed);
        this.body.velocity.x = magnitude * Math.cos(angle);
        this.body.velocity.y = magnitude * Math.sin(angle);
    }

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};
},{}],3:[function(require,module,exports){
/**
 * @module Controller
 */
module.exports = Controller;

/**
 * A helper class for abstracting away a controller. This can register multiple
 * control keys to the same action, e.g. using both "left" and "w" for moving a
 * character left.
 * @class Controller
 * @constructor
 * @param {object} input A reference to a Phaser.input for the current game.
 */
function Controller(input) {
    this._input = input;

    // An object for holding onto the current state of the controls. It holds on
    // to how many keys are pressed for a specific control, e.g. if "left" and
    // "w" are pressed, the state for the "left" key would be 2.
    this._controlStates = {};
}

/**
 * Check whether a specified control is currently active.
 * @param  {string}  controlName The name of the control which was registered in 
 *                               Controller.addKey.
 * @return {Boolean}             Whether or not the control is active.
 */
Controller.prototype.isControlActive = function (controlName) {
    return (this._controlStates[controlName] !== 0);
};

/**
 * Register a key or keys under a control name.
 * @param {string}          controlName The name of the control, e.g. "jump" or
 *                                      "left".
 * @param {number[]|number} keyCodes    The key code or an array of key codes to
 *                                      register under a control name, e.g. 
 *                                      Phaser.Keyboard.SPACEBAR
 */
Controller.prototype.addKeyboardControl = function (controlName, keyCodes) {
    if (this._controlStates[controlName] === undefined) {
        this._controlStates[controlName] = 0;
    }
    if (!Array.isArray(keyCodes)) keyCodes = [keyCodes];
    for (var i = 0; i < keyCodes.length; i += 1) {
        var key = this._input.keyboard.addKey(keyCodes[i]);
        key.onDown.add(this._onKeyDown, this, 0, controlName);
        key.onUp.add(this._onKeyUp, this, 0, controlName);
    }
};

/**
 * Handle when a key associated with a control is pressed.
 * @private
 */
Controller.prototype._onKeyDown = function (key, controlName) {
    this._controlStates[controlName] += 1;
};

/**
 * Handle when a key associated with a control is released.
 * @private
 */
Controller.prototype._onKeyUp = function (key, controlName) {
    this._controlStates[controlName] -= 1;
};
},{}],4:[function(require,module,exports){
var GameState = require("./states/game-state.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");

var gameContainer = document.getElementById("game-container");
var game = new Phaser.Game(800, 600, Phaser.AUTO, gameContainer);
game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("game", GameState);
game.state.start("boot");
},{"./states/boot-state.js":5,"./states/game-state.js":6,"./states/load-state.js":7}],5:[function(require,module,exports){
/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

module.exports = BootState;

function BootState(game) {}

BootState.prototype.create = function () {
    // Take care of any global game settings that need to be set up
    // Make sure that sprites are drawn at integer positions - to avoid 
    // sub-pixel position blurring
    this.game.renderer.renderSession.roundPixels = true;
    // Disable cursor
    this.game.canvas.style.cursor = "none";
    // Disable the built-in pausing. This is useful for debugging, but may also
    // be useful for the game logic
    this.stage.disableVisibilityChange = true;
    this.stage.backgroundColor = "#F9F9F9";

    this.game.state.start("load");
};
},{}],6:[function(require,module,exports){
/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/seeker-enemy.js");

function GameState(game) {}

GameState.prototype.create = function () {
    this.stage.backgroundColor = "#AAA000";
    this.world.resize(2000, 2000);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.y = 0;
    this.physics.arcade.gravity.x = 0;

    this.stage.backgroundColor = "#F9F9F9";

    var tileSprite = this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid");

    var player = new Player(this.game, this.world.centerX, this.world.centerY);
    this.camera.follow(player);

    for (var i = 0; i < 300; i += 1) {
        var seeker = new Seeker(this.game, this.world.randomX, 
            this.world.randomY, player);
    }
};


},{"../game-objects/player.js":1,"../game-objects/seeker-enemy.js":2}],7:[function(require,module,exports){
/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState(game) {}

LoadState.prototype.preload = function () {    
    // Images
    this.load.atlasJSONHash("assets", "images/atlases/assets.png", 
        "images/atlases/assets.json");

    // Stand-in for a loading bar
    this.loadingText = this.add.text(this.world.centerX, this.world.centerY, 
        "0%", { 
            font: "200px Arial", 
            fill: "#000", 
            align: "center" 
        });
    this.loadingText.anchor.set(0.5);
};

LoadState.prototype.loadRender = function () {
    this.loadingText.setText(this.load.progress + "%");
};

LoadState.prototype.create = function () {
    // Since load progress might not reach 100 in the load loop, manually do it
    this.loadingText.setText("100%");

    this.game.state.start("game");
};
},{}]},{},[4])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3BsYXllci5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvc2Vla2VyLWVuZW15LmpzIiwic3JjL2pzL2hlbHBlcnMvY29udHJvbGxlci5qcyIsInNyYy9qcy9tYWluLmpzIiwic3JjL2pzL3N0YXRlcy9ib290LXN0YXRlLmpzIiwic3JjL2pzL3N0YXRlcy9nYW1lLXN0YXRlLmpzIiwic3JjL2pzL3N0YXRlcy9sb2FkLXN0YXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUMxREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2REE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ1RBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN2QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcclxuXHJcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZShcIi4uL2hlbHBlcnMvY29udHJvbGxlci5qc1wiKTtcclxuXHJcbi8vIFByb3RvdHlwZSBjaGFpbiAtIGluaGVyaXRzIGZyb20gU3ByaXRlXHJcblBsYXllci5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuUGxheWVyLnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IFBsYXllcjsgLy8gTWFrZSBzdXJlIGNvbnN0cnVjdG9yIHJlYWRzIHByb3Blcmx5XHJcblxyXG5mdW5jdGlvbiBQbGF5ZXIoZ2FtZSwgeCwgeSwgcGFyZW50R3JvdXApIHtcclxuICAgIC8vIENhbGwgdGhlIHNwcml0ZSBjb25zdHJ1Y3RvciwgYnV0IGluc3RlYWQgb2YgaXQgY3JlYXRpbmcgYSBuZXcgb2JqZWN0LCBpdFxyXG4gICAgLy8gbW9kaWZpZXMgdGhlIGN1cnJlbnQgXCJ0aGlzXCIgb2JqZWN0XHJcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgXCJhc3NldHNcIiwgXCJwbGF5ZXJcIik7XHJcbiAgICB0aGlzLmFuY2hvci5zZXQoMC41KTtcclxuICAgIFxyXG4gICAgLy8gQWRkIHRvIHBhcmVudEdyb3VwLCBpZiBpdCBpcyBkZWZpbmVkXHJcbiAgICBpZiAocGFyZW50R3JvdXApIHBhcmVudEdyb3VwLmFkZCh0aGlzKTtcclxuICAgIGVsc2UgZ2FtZS5hZGQuZXhpc3RpbmcodGhpcyk7XHJcblxyXG4gICAgLy8gQ29uZmlndXJlIHBsYXllciBwaHlzaWNzXHJcbiAgICB0aGlzLl9tYXhTcGVlZCA9IDUwMDtcclxuICAgIHRoaXMuX21heEFjY2VsZXJhdGlvbiA9IDEwMDAwO1xyXG4gICAgdGhpcy5fbWF4RHJhZyA9IDQwMDA7XHJcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzKTtcclxuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xyXG4gICAgdGhpcy5ib2R5LnNldFNpemUoMzYsIDM2KTtcclxuICAgIHRoaXMuYm9keS5kcmFnLnNldCh0aGlzLl9tYXhEcmFnLCB0aGlzLl9tYXhEcmFnKTtcclxuXHJcbiAgICAvLyBQbGF5ZXIgY29udHJvbHNcclxuICAgIHRoaXMuX2NvbnRyb2xzID0gbmV3IENvbnRyb2xsZXIodGhpcy5nYW1lLmlucHV0KTtcclxuICAgIHZhciBLYiA9IFBoYXNlci5LZXlib2FyZDtcclxuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcInVwXCIsIFtLYi5XLCBLYi5VUF0pO1xyXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwibGVmdFwiLCBbS2IuQSwgS2IuTEVGVF0pO1xyXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwicmlnaHRcIiwgW0tiLkQsIEtiLlJJR0hUXSk7XHJcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJkb3duXCIsIFtLYi5TLCBLYi5ET1dOXSk7XHJcbn1cclxuXHJcblBsYXllci5wcm90b3R5cGUudXBkYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gQ2FsY3VsYXRlIHRoZSBwbGF5ZXIncyBuZXcgYWNjZWxlcmF0aW9uLiBJdCBzaG91bGQgYmUgemVybyBpZiBubyBrZXlzIGFyZVxyXG4gICAgLy8gcHJlc3NlZCAtIGFsbG93cyBmb3IgcXVpY2sgc3RvcHBpbmcuXHJcbiAgICB2YXIgYWNjZWxlcmF0aW9uID0gbmV3IFBoYXNlci5Qb2ludCgwLCAwKTtcclxuXHJcbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwibGVmdFwiKSkgYWNjZWxlcmF0aW9uLnggPSAtMTtcclxuICAgIGVsc2UgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcInJpZ2h0XCIpKSBhY2NlbGVyYXRpb24ueCA9IDE7XHJcbiAgICBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwidXBcIikpIGFjY2VsZXJhdGlvbi55ID0gLTE7XHJcbiAgICBlbHNlIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJkb3duXCIpKSBhY2NlbGVyYXRpb24ueSA9IDE7XHJcblxyXG4gICAgLy8gTm9ybWFsaXplIHRoZSBhY2NlbGVyYXRpb24gYW5kIHNldCB0aGUgbWFnbml0dWRlLiBUaGlzIG1ha2VzIGl0IHNvIHRoYXRcclxuICAgIC8vIHRoZSBwbGF5ZXIgbW92ZXMgaW4gdGhlIHNhbWUgc3BlZWQgaW4gYWxsIGRpcmVjdGlvbnMuXHJcbiAgICBhY2NlbGVyYXRpb24gPSBhY2NlbGVyYXRpb24uc2V0TWFnbml0dWRlKHRoaXMuX21heEFjY2VsZXJhdGlvbik7XHJcbiAgICB0aGlzLmJvZHkuYWNjZWxlcmF0aW9uLmNvcHlGcm9tKGFjY2VsZXJhdGlvbik7XHJcblxyXG4gICAgLy8gQ2FwIHRoZSB2ZWxvY2l0eS4gUGhhc2VyIHBoeXNpY3MncyBtYXggdmVsb2NpdHkgY2FwcyB0aGUgdmVsb2NpdHkgaW4gdGhlXHJcbiAgICAvLyB4ICYgeSBkaW1lbnNpb25zIHNlcGFyYXRlbHkuIFRoaXMgYWxsb3dzIHRoZSBzcHJpdGUgdG8gbW92ZSBmYXN0ZXIgYWxvbmdcclxuICAgIC8vIGEgZGlhZ29uYWwgdGhhbiBpdCB3b3VsZCBhbG9uZyB0aGUgeCBvciB5IGF4aXMuIFRvIGZpeCB0aGF0LCB3ZSBuZWVkIHRvXHJcbiAgICAvLyBjYXAgdGhlIHZlbG9jaXR5IGJhc2VkIG9uIGl0J3MgbWFnbml0dWRlLlxyXG4gICAgaWYgKHRoaXMuYm9keS52ZWxvY2l0eS5nZXRNYWduaXR1ZGUoKSA+IHRoaXMuX21heFNwZWVkKSB7XHJcbiAgICAgICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldE1hZ25pdHVkZSh0aGlzLl9tYXhTcGVlZCk7XHJcbiAgICB9XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBTZWVrZXJFbmVteTtcclxuXHJcbi8vIFByb3RvdHlwZSBjaGFpbiAtIGluaGVyaXRzIGZyb20gU3ByaXRlXHJcblNlZWtlckVuZW15LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xyXG5TZWVrZXJFbmVteS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTZWVrZXJFbmVteTsgLy8gTWFrZSBzdXJlIGNvbnN0cnVjdG9yIHJlYWRzIHByb3Blcmx5XHJcblxyXG5mdW5jdGlvbiBTZWVrZXJFbmVteShnYW1lLCB4LCB5LCB0YXJnZXQsIHBhcmVudEdyb3VwKSB7XHJcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgXCJhc3NldHNcIiwgXCJwbGF5ZXJcIik7XHJcbiAgICB0aGlzLnNjYWxlLnNldCgwLjc1KTtcclxuICAgIHRoaXMuYW5jaG9yLnNldCgwLjUpO1xyXG4gICAgXHJcbiAgICAvLyBBZGQgdG8gcGFyZW50R3JvdXAsIGlmIGl0IGlzIGRlZmluZWRcclxuICAgIGlmIChwYXJlbnRHcm91cCkgcGFyZW50R3JvdXAuYWRkKHRoaXMpO1xyXG4gICAgZWxzZSBnYW1lLmFkZC5leGlzdGluZyh0aGlzKTtcclxuXHJcbiAgICAvLyBHaXZlIHRoZSBzcHJpdGUgYSByYW5kb20gdGludFxyXG4gICAgdmFyIHJhbmRMaWdodG5lc3MgPSB0aGlzLmdhbWUucm5kLnJlYWxJblJhbmdlKDAuNCwgMC42KTtcclxuICAgIHZhciByZ2IgPSBQaGFzZXIuQ29sb3IuSFNMdG9SR0IoMC45OCwgMSwgcmFuZExpZ2h0bmVzcyk7XHJcbiAgICB0aGlzLnRpbnQgPSBQaGFzZXIuQ29sb3IuZ2V0Q29sb3IocmdiLnIsIHJnYi5nLCByZ2IuYik7XHJcblxyXG4gICAgdGhpcy5fdGFyZ2V0ID0gdGFyZ2V0O1xyXG4gICAgdGhpcy5fdmlzaW9uUmFkaXVzID0gMzAwO1xyXG5cclxuICAgIC8vIENvbmZpZ3VyZSBwbGF5ZXIgcGh5c2ljc1xyXG4gICAgdGhpcy5fbWF4U3BlZWQgPSAyMDA7XHJcbiAgICB0aGlzLl9tYXhEcmFnID0gNDAwMDtcclxuICAgIGdhbWUucGh5c2ljcy5hcmNhZGUuZW5hYmxlKHRoaXMpO1xyXG4gICAgdGhpcy5ib2R5LmNvbGxpZGVXb3JsZEJvdW5kcyA9IHRydWU7XHJcbiAgICB0aGlzLmJvZHkuc2V0U2l6ZSgzNiwgMzYpO1xyXG4gICAgdGhpcy5ib2R5LmRyYWcuc2V0KHRoaXMuX21heERyYWcsIHRoaXMuX21heERyYWcpO1xyXG59XHJcblxyXG4vKipcclxuICogT3ZlcnJpZGUgcHJlVXBkYXRlIHRvIHVwZGF0ZSB2ZWxvY2l0eS4gUGh5c2ljcyB1cGRhdGVzIGhhcHBlbiBpbiBwcmVVcGRhdGUsXHJcbiAqIHNvIGlmIHRoZSB2ZWxvY2l0eSB1cGRhdGVzIGhhcHBlbmVkIEFGVEVSIHRoYXQsIHRoZSB0YXJnZXRpbmcgd291bGQgYmUgb2ZmXHJcbiAqIGJ5IGEgZnJhbWUuXHJcbiAqL1xyXG5TZWVrZXJFbmVteS5wcm90b3R5cGUucHJlVXBkYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldCgwKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB0YXJnZXQgaXMgd2l0aGluIHZpc3VhbCByYW5nZVxyXG4gICAgdmFyIGRpc3RhbmNlID0gdGhpcy5wb3NpdGlvbi5kaXN0YW5jZSh0aGlzLl90YXJnZXQucG9zaXRpb24pO1xyXG4gICAgaWYgKGRpc3RhbmNlIDw9IHRoaXMuX3Zpc2lvblJhZGl1cykge1xyXG4gICAgICAgIC8vIElmIHRhcmdldCBpcyBpbiByYW5nZSwgY2FsY3VsYXRlIHRoZSBhY2NlbGVyYXRpb24gYmFzZWQgb24gdGhlIFxyXG4gICAgICAgIC8vIGRpcmVjdGlvbiB0aGlzIHNwcml0ZSBuZWVkcyB0byB0cmF2ZWwgdG8gaGl0IHRoZSB0YXJnZXRcclxuICAgICAgICB2YXIgYW5nbGUgPSB0aGlzLnBvc2l0aW9uLmFuZ2xlKHRoaXMuX3RhcmdldC5wb3NpdGlvbik7XHJcbiAgICAgICAgdmFyIHRhcmdldFNwZWVkID0gZGlzdGFuY2UgLyB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcclxuICAgICAgICB2YXIgbWFnbml0dWRlID0gTWF0aC5taW4odGhpcy5fbWF4U3BlZWQsIHRhcmdldFNwZWVkKTtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IG1hZ25pdHVkZSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueSA9IG1hZ25pdHVkZSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxsIHRoZSBwYXJlbnQncyBwcmVVcGRhdGUgYW5kIHJldHVybiB0aGUgdmFsdWUuIFNvbWV0aGluZyBlbHNlIGluXHJcbiAgICAvLyBQaGFzZXIgbWlnaHQgdXNlIGl0Li4uXHJcbiAgICByZXR1cm4gUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUucHJlVXBkYXRlLmNhbGwodGhpcyk7XHJcbn07IiwiLyoqXHJcbiAqIEBtb2R1bGUgQ29udHJvbGxlclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyO1xyXG5cclxuLyoqXHJcbiAqIEEgaGVscGVyIGNsYXNzIGZvciBhYnN0cmFjdGluZyBhd2F5IGEgY29udHJvbGxlci4gVGhpcyBjYW4gcmVnaXN0ZXIgbXVsdGlwbGVcclxuICogY29udHJvbCBrZXlzIHRvIHRoZSBzYW1lIGFjdGlvbiwgZS5nLiB1c2luZyBib3RoIFwibGVmdFwiIGFuZCBcIndcIiBmb3IgbW92aW5nIGFcclxuICogY2hhcmFjdGVyIGxlZnQuXHJcbiAqIEBjbGFzcyBDb250cm9sbGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gaW5wdXQgQSByZWZlcmVuY2UgdG8gYSBQaGFzZXIuaW5wdXQgZm9yIHRoZSBjdXJyZW50IGdhbWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBDb250cm9sbGVyKGlucHV0KSB7XHJcbiAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xyXG5cclxuICAgIC8vIEFuIG9iamVjdCBmb3IgaG9sZGluZyBvbnRvIHRoZSBjdXJyZW50IHN0YXRlIG9mIHRoZSBjb250cm9scy4gSXQgaG9sZHMgb25cclxuICAgIC8vIHRvIGhvdyBtYW55IGtleXMgYXJlIHByZXNzZWQgZm9yIGEgc3BlY2lmaWMgY29udHJvbCwgZS5nLiBpZiBcImxlZnRcIiBhbmRcclxuICAgIC8vIFwid1wiIGFyZSBwcmVzc2VkLCB0aGUgc3RhdGUgZm9yIHRoZSBcImxlZnRcIiBrZXkgd291bGQgYmUgMi5cclxuICAgIHRoaXMuX2NvbnRyb2xTdGF0ZXMgPSB7fTtcclxufVxyXG5cclxuLyoqXHJcbiAqIENoZWNrIHdoZXRoZXIgYSBzcGVjaWZpZWQgY29udHJvbCBpcyBjdXJyZW50bHkgYWN0aXZlLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBjb250cm9sTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udHJvbCB3aGljaCB3YXMgcmVnaXN0ZXJlZCBpbiBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgQ29udHJvbGxlci5hZGRLZXkuXHJcbiAqIEByZXR1cm4ge0Jvb2xlYW59ICAgICAgICAgICAgIFdoZXRoZXIgb3Igbm90IHRoZSBjb250cm9sIGlzIGFjdGl2ZS5cclxuICovXHJcbkNvbnRyb2xsZXIucHJvdG90eXBlLmlzQ29udHJvbEFjdGl2ZSA9IGZ1bmN0aW9uIChjb250cm9sTmFtZSkge1xyXG4gICAgcmV0dXJuICh0aGlzLl9jb250cm9sU3RhdGVzW2NvbnRyb2xOYW1lXSAhPT0gMCk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXIgYSBrZXkgb3Iga2V5cyB1bmRlciBhIGNvbnRyb2wgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIGNvbnRyb2xOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250cm9sLCBlLmcuIFwianVtcFwiIG9yXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIi5cclxuICogQHBhcmFtIHtudW1iZXJbXXxudW1iZXJ9IGtleUNvZGVzICAgIFRoZSBrZXkgY29kZSBvciBhbiBhcnJheSBvZiBrZXkgY29kZXMgdG9cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyIHVuZGVyIGEgY29udHJvbCBuYW1lLCBlLmcuIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSXHJcbiAqL1xyXG5Db250cm9sbGVyLnByb3RvdHlwZS5hZGRLZXlib2FyZENvbnRyb2wgPSBmdW5jdGlvbiAoY29udHJvbE5hbWUsIGtleUNvZGVzKSB7XHJcbiAgICBpZiAodGhpcy5fY29udHJvbFN0YXRlc1tjb250cm9sTmFtZV0gPT09IHVuZGVmaW5lZCkge1xyXG4gICAgICAgIHRoaXMuX2NvbnRyb2xTdGF0ZXNbY29udHJvbE5hbWVdID0gMDtcclxuICAgIH1cclxuICAgIGlmICghQXJyYXkuaXNBcnJheShrZXlDb2RlcykpIGtleUNvZGVzID0gW2tleUNvZGVzXTtcclxuICAgIGZvciAodmFyIGkgPSAwOyBpIDwga2V5Q29kZXMubGVuZ3RoOyBpICs9IDEpIHtcclxuICAgICAgICB2YXIga2V5ID0gdGhpcy5faW5wdXQua2V5Ym9hcmQuYWRkS2V5KGtleUNvZGVzW2ldKTtcclxuICAgICAgICBrZXkub25Eb3duLmFkZCh0aGlzLl9vbktleURvd24sIHRoaXMsIDAsIGNvbnRyb2xOYW1lKTtcclxuICAgICAgICBrZXkub25VcC5hZGQodGhpcy5fb25LZXlVcCwgdGhpcywgMCwgY29udHJvbE5hbWUpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIEhhbmRsZSB3aGVuIGEga2V5IGFzc29jaWF0ZWQgd2l0aCBhIGNvbnRyb2wgaXMgcHJlc3NlZC5cclxuICogQHByaXZhdGVcclxuICovXHJcbkNvbnRyb2xsZXIucHJvdG90eXBlLl9vbktleURvd24gPSBmdW5jdGlvbiAoa2V5LCBjb250cm9sTmFtZSkge1xyXG4gICAgdGhpcy5fY29udHJvbFN0YXRlc1tjb250cm9sTmFtZV0gKz0gMTtcclxufTtcclxuXHJcbi8qKlxyXG4gKiBIYW5kbGUgd2hlbiBhIGtleSBhc3NvY2lhdGVkIHdpdGggYSBjb250cm9sIGlzIHJlbGVhc2VkLlxyXG4gKiBAcHJpdmF0ZVxyXG4gKi9cclxuQ29udHJvbGxlci5wcm90b3R5cGUuX29uS2V5VXAgPSBmdW5jdGlvbiAoa2V5LCBjb250cm9sTmFtZSkge1xyXG4gICAgdGhpcy5fY29udHJvbFN0YXRlc1tjb250cm9sTmFtZV0gLT0gMTtcclxufTsiLCJ2YXIgR2FtZVN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVzL2dhbWUtc3RhdGUuanNcIik7XHJcbnZhciBCb290U3RhdGUgPSByZXF1aXJlKFwiLi9zdGF0ZXMvYm9vdC1zdGF0ZS5qc1wiKTtcclxudmFyIExvYWRTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlcy9sb2FkLXN0YXRlLmpzXCIpO1xyXG5cclxudmFyIGdhbWVDb250YWluZXIgPSBkb2N1bWVudC5nZXRFbGVtZW50QnlJZChcImdhbWUtY29udGFpbmVyXCIpO1xyXG52YXIgZ2FtZSA9IG5ldyBQaGFzZXIuR2FtZSg4MDAsIDYwMCwgUGhhc2VyLkFVVE8sIGdhbWVDb250YWluZXIpO1xyXG5nYW1lLnN0YXRlLmFkZChcImJvb3RcIiwgQm9vdFN0YXRlKTtcclxuZ2FtZS5zdGF0ZS5hZGQoXCJsb2FkXCIsIExvYWRTdGF0ZSk7XHJcbmdhbWUuc3RhdGUuYWRkKFwiZ2FtZVwiLCBHYW1lU3RhdGUpO1xyXG5nYW1lLnN0YXRlLnN0YXJ0KFwiYm9vdFwiKTsiLCIvKipcclxuICogQm9vdFN0YXRlXHJcbiAqIC0gU2V0cyBhbnkgZ2xvYmFsIHNldHRpbmdzIGZvciB0aGUgZ2FtZVxyXG4gKiAtIExvYWRzIG9ubHkgdGhlIGFzc2V0cyBuZWVkZWQgZm9yIHRoZSBMb2FkU3RhdGVcclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IEJvb3RTdGF0ZTtcclxuXHJcbmZ1bmN0aW9uIEJvb3RTdGF0ZShnYW1lKSB7fVxyXG5cclxuQm9vdFN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGdsb2JhbCBnYW1lIHNldHRpbmdzIHRoYXQgbmVlZCB0byBiZSBzZXQgdXBcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHNwcml0ZXMgYXJlIGRyYXduIGF0IGludGVnZXIgcG9zaXRpb25zIC0gdG8gYXZvaWQgXHJcbiAgICAvLyBzdWItcGl4ZWwgcG9zaXRpb24gYmx1cnJpbmdcclxuICAgIHRoaXMuZ2FtZS5yZW5kZXJlci5yZW5kZXJTZXNzaW9uLnJvdW5kUGl4ZWxzID0gdHJ1ZTtcclxuICAgIC8vIERpc2FibGUgY3Vyc29yXHJcbiAgICB0aGlzLmdhbWUuY2FudmFzLnN0eWxlLmN1cnNvciA9IFwibm9uZVwiO1xyXG4gICAgLy8gRGlzYWJsZSB0aGUgYnVpbHQtaW4gcGF1c2luZy4gVGhpcyBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZywgYnV0IG1heSBhbHNvXHJcbiAgICAvLyBiZSB1c2VmdWwgZm9yIHRoZSBnYW1lIGxvZ2ljXHJcbiAgICB0aGlzLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcclxuICAgIHRoaXMuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gXCIjRjlGOUY5XCI7XHJcblxyXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KFwibG9hZFwiKTtcclxufTsiLCIvKipcclxuICogR2FtZVN0YXRlIC0gdGhpcyBpcyB0aGUgbWFpbiBsZXZlbCBmb3Igbm93XHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGU7XHJcblxyXG52YXIgUGxheWVyID0gcmVxdWlyZShcIi4uL2dhbWUtb2JqZWN0cy9wbGF5ZXIuanNcIik7XHJcbnZhciBTZWVrZXIgPSByZXF1aXJlKFwiLi4vZ2FtZS1vYmplY3RzL3NlZWtlci1lbmVteS5qc1wiKTtcclxuXHJcbmZ1bmN0aW9uIEdhbWVTdGF0ZShnYW1lKSB7fVxyXG5cclxuR2FtZVN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IFwiI0FBQTAwMFwiO1xyXG4gICAgdGhpcy53b3JsZC5yZXNpemUoMjAwMCwgMjAwMCk7XHJcblxyXG4gICAgLy8gUGh5c2ljc1xyXG4gICAgdGhpcy5waHlzaWNzLnN0YXJ0U3lzdGVtKFBoYXNlci5QaHlzaWNzLkFSQ0FERSk7XHJcbiAgICB0aGlzLnBoeXNpY3MuYXJjYWRlLmdyYXZpdHkueSA9IDA7XHJcbiAgICB0aGlzLnBoeXNpY3MuYXJjYWRlLmdyYXZpdHkueCA9IDA7XHJcblxyXG4gICAgdGhpcy5zdGFnZS5iYWNrZ3JvdW5kQ29sb3IgPSBcIiNGOUY5RjlcIjtcclxuXHJcbiAgICB2YXIgdGlsZVNwcml0ZSA9IHRoaXMuYWRkLnRpbGVTcHJpdGUoMCwgMCwgMjAwMCwgMjAwMCwgXCJhc3NldHNcIiwgXCJncmlkXCIpO1xyXG5cclxuICAgIHZhciBwbGF5ZXIgPSBuZXcgUGxheWVyKHRoaXMuZ2FtZSwgdGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclkpO1xyXG4gICAgdGhpcy5jYW1lcmEuZm9sbG93KHBsYXllcik7XHJcblxyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzMDA7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBzZWVrZXIgPSBuZXcgU2Vla2VyKHRoaXMuZ2FtZSwgdGhpcy53b3JsZC5yYW5kb21YLCBcclxuICAgICAgICAgICAgdGhpcy53b3JsZC5yYW5kb21ZLCBwbGF5ZXIpO1xyXG4gICAgfVxyXG59O1xyXG5cclxuIiwiLyoqXHJcbiAqIExvYWRTdGF0ZSAtIHRoaXMgaXMgdGhlIGxvYWRpbmcgc2NyZWVuXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBMb2FkU3RhdGU7XHJcblxyXG5mdW5jdGlvbiBMb2FkU3RhdGUoZ2FtZSkge31cclxuXHJcbkxvYWRTdGF0ZS5wcm90b3R5cGUucHJlbG9hZCA9IGZ1bmN0aW9uICgpIHsgICAgXHJcbiAgICAvLyBJbWFnZXNcclxuICAgIHRoaXMubG9hZC5hdGxhc0pTT05IYXNoKFwiYXNzZXRzXCIsIFwiaW1hZ2VzL2F0bGFzZXMvYXNzZXRzLnBuZ1wiLCBcclxuICAgICAgICBcImltYWdlcy9hdGxhc2VzL2Fzc2V0cy5qc29uXCIpO1xyXG5cclxuICAgIC8vIFN0YW5kLWluIGZvciBhIGxvYWRpbmcgYmFyXHJcbiAgICB0aGlzLmxvYWRpbmdUZXh0ID0gdGhpcy5hZGQudGV4dCh0aGlzLndvcmxkLmNlbnRlclgsIHRoaXMud29ybGQuY2VudGVyWSwgXHJcbiAgICAgICAgXCIwJVwiLCB7IFxyXG4gICAgICAgICAgICBmb250OiBcIjIwMHB4IEFyaWFsXCIsIFxyXG4gICAgICAgICAgICBmaWxsOiBcIiMwMDBcIiwgXHJcbiAgICAgICAgICAgIGFsaWduOiBcImNlbnRlclwiIFxyXG4gICAgICAgIH0pO1xyXG4gICAgdGhpcy5sb2FkaW5nVGV4dC5hbmNob3Iuc2V0KDAuNSk7XHJcbn07XHJcblxyXG5Mb2FkU3RhdGUucHJvdG90eXBlLmxvYWRSZW5kZXIgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICB0aGlzLmxvYWRpbmdUZXh0LnNldFRleHQodGhpcy5sb2FkLnByb2dyZXNzICsgXCIlXCIpO1xyXG59O1xyXG5cclxuTG9hZFN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBTaW5jZSBsb2FkIHByb2dyZXNzIG1pZ2h0IG5vdCByZWFjaCAxMDAgaW4gdGhlIGxvYWQgbG9vcCwgbWFudWFsbHkgZG8gaXRcclxuICAgIHRoaXMubG9hZGluZ1RleHQuc2V0VGV4dChcIjEwMCVcIik7XHJcblxyXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KFwiZ2FtZVwiKTtcclxufTsiXX0=
