(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
module.exports = Bullet;

Bullet.prototype = Object.create(Phaser.Sprite.prototype);
Bullet.prototype.constructor = Bullet;

function Bullet(game, x, y, parentGroup, angle, enemies) {
    Phaser.Sprite.call(this, game, x, y, "assets", "bullet");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._enemies = enemies;
    this._speed = 300;
    this._range = 500;
    this._initialPos = this.position.clone();

    // Rotate bullet to face in the right direction. The bullet image is saved
    // facing up (90 degrees), so we need to offset the angle
    this.rotation = angle + Math.PI / 2; // Radians
    
    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);
}

Bullet.prototype.update = function () {
    this.game.physics.arcade.overlap(this, this._enemies,
        this._onCollideWithEnemy, null, this);
    if (this.position.distance(this._initialPos) > this._range) {
        this.destroy();
    }
};

Bullet.prototype._onCollideWithEnemy = function (self, enemy) {
    enemy.destroy();
};
},{}],2:[function(require,module,exports){
module.exports = Gun;

var Bullet = require("./bullet.js");

Gun.prototype = Object.create(Phaser.Group.prototype);
Gun.prototype.constructor = Gun;

function Gun(game, parentGroup, player, enemies) {
    Phaser.Group.call(this, game, parentGroup, "bullet");

    this._player = player;
    this._enemies = enemies;

    // Set up a timer that doesn't autodestroy itself
    this._bulletCooldownTimer = this.game.time.create(false);
    this._bulletCooldownTimer.start();
    this._bulletCooldownTime = 150; // Milliseconds 
    this._ableToFire = true;

    // Clean up
    this.onDestroy.add(this._onDestroy, this);
}

Gun.prototype.fire = function (targetPos) {
    if (this._ableToFire) {
        // Find trajectory
        var angle = this._player.position.angle(targetPos); // Radians
        // Start bullet in a position along that trajectory, but in front of the
        // player
        var bulletPos = this._player.position.clone();
        bulletPos.x += (0.75 * this._player.width) * Math.cos(angle);
        bulletPos.y += (0.75 * this._player.width) * Math.sin(angle);
        new Bullet(this.game, bulletPos.x, bulletPos.y, this, angle, 
            this._enemies);
        this._startCooldown();
    }
};

Gun.prototype._startCooldown = function () {
    this._ableToFire = false;
    this._bulletCooldownTimer.add(this._bulletCooldownTime, function () {
        this._ableToFire = true;
    }, this);
};

Gun.prototype._onDestroy = function () {
    // Since the timer doesn't destroy itself, we have to schedule its
    // destruction or it will stick around after the Gun is destroyed.
    this._bulletCooldownTimer.destroy();
};
},{"./bullet.js":1}],3:[function(require,module,exports){
module.exports = Player;

var Controller = require("../helpers/controller.js");
var Gun = require("./gun.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup, enemies, reticule) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._reticule = reticule;
    this._enemies = enemies;

    this._gun = new Gun(game, parentGroup, this, enemies);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("player/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("player/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.IDLE);

    // Configure player physics
    this._maxSpeed = 100;
    this._maxAcceleration = 5000;
    this._maxDrag = 4000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.drag.set(this._maxDrag, this._maxDrag);
    this.body.setCircle(this.width / 2 * 0.5); // Fudge factor

    // Player controls
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    this._controls.addKeyboardControl("up", [Kb.W, Kb.UP]);
    this._controls.addKeyboardControl("left", [Kb.A, Kb.LEFT]);
    this._controls.addKeyboardControl("right", [Kb.D, Kb.RIGHT]);
    this._controls.addKeyboardControl("down", [Kb.S, Kb.DOWN]);
    this._controls.addKeyboardControl("fire", [Kb.SPACEBAR]);
    this._controls.addMouseDownControl("fire", Phaser.Pointer.LEFT_BUTTON);
}

Player.prototype.update = function () {
    this._controls.update();

    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    if (this._controls.isControlActive("left")) acceleration.x = -1;
    else if (this._controls.isControlActive("right")) acceleration.x = 1;
    if (this._controls.isControlActive("up")) acceleration.y = -1;
    else if (this._controls.isControlActive("down")) acceleration.y = 1;

    // Check whether player is moving in order to update its animation
    var isIdle = acceleration.isZero(); 
    if (isIdle && this.animations.name !== ANIM_NAMES.IDLE) {
        this.animations.play(ANIM_NAMES.IDLE);
    } else if (!isIdle && this.animations.name !== ANIM_NAMES.MOVE) {
        this.animations.play(ANIM_NAMES.MOVE);
    }

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

    // Firing logic
    if (this._controls.isControlActive("fire")) {
        this._gun.fire(this._reticule.position);
    }

    // Enemy collisions
    this.game.physics.arcade.overlap(this, this._enemies, 
        this._onCollideWithEnemy, null, this);
};

Player.prototype._onCollideWithEnemy = function () {
    // Hacky restart (for now)
    this.game.state.restart();
};
},{"../helpers/controller.js":6,"./gun.js":2}],4:[function(require,module,exports){
module.exports = Reticule;

Reticule.prototype = Object.create(Phaser.Sprite.prototype);
Reticule.prototype.constructor = Reticule;

function Reticule(game, parentGroup) {
    Phaser.Sprite.call(this, game, 0, 0, "assets", "reticule");
    this.anchor.set(0.5);
    parentGroup.add(this);
    
    this._updatePosition();
}

Reticule.prototype._updatePosition = function() {
    var newPos = Phaser.Point.add(this.game.camera.position, 
        this.game.input.activePointer);
    this.position.copyFrom(newPos);
};

Reticule.prototype.update = function () {
    this._updatePosition();
};
},{}],5:[function(require,module,exports){
module.exports = SeekerEnemy;

// Prototype chain - inherits from Sprite
SeekerEnemy.prototype = Object.create(Phaser.Sprite.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy;

function SeekerEnemy(game, x, y, parentGroup, target) {
    Phaser.Sprite.call(this, game, x, y, "assets", "enemy/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);
    
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
    this.body.drag.set(this._maxDrag, this._maxDrag);
    this.body.setCircle(this.width / 2 * 0.8); // Fudge factor
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
},{}],6:[function(require,module,exports){
/**
 * @module Controller
 */
module.exports = Controller;

/**
 * This object can be used to look up the mouse button property that corresponds
 * with the button's numerical ID.
 * @type {Object}
 */
var POINTER_BUTTONS_LOOKUP = {};
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.LEFT_BUTTON] = "leftButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.MIDDLE_BUTTON] = "middleButton";
POINTER_BUTTONS_LOOKUP[Phaser.Pointer.RIGHT_BUTTON] = "rightButton";
    
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

    // Object containing the active control names. If a control is active, this
    // will have a property (that control's name) set to true. Inactive controls
    // are not stored in the object.
    this._activeControls = {};

    // Objects containing the mapping of: 
    //  keyCode/mouseButton -> control name
    this._keyboardMap = {};
    this._mouseMap = {};
}

/**
 * Check what controls are active. This must be called once per frame, before
 * Controller.isControlActive.
 */
Controller.prototype.update = function () {
    // Reset controls
    this._activeControls = {};

    // Check for any registered mouse controls that have been activated
    var activePointer = this._input.activePointer;
    for (var buttonName in this._mouseMap) {
        var controls = this._mouseMap[buttonName];
        var buttonPropertyName = POINTER_BUTTONS_LOOKUP[buttonName];
        var pointerButton = activePointer[buttonPropertyName];
        if (pointerButton.isDown) {
            this._activateControls(controls);
        }
    }

    // Check for any registered keyboard controls that have been activated
    for (var keyCode in this._keyboardMap) {
        var controls = this._keyboardMap[keyCode];
        if (this._input.keyboard.isDown(keyCode)) {
            this._activateControls(controls);
        }
        // TODO: isDown(...) only works in browsers. Make this mobile-friendly.
    }
};

/**
 * Check whether a specified control is currently active.
 * @param  {string}  controlName The name of the control which was registered in
 *                               Controller.addKey.
 * @return {Boolean}             Whether or not the control is active.
 */
Controller.prototype.isControlActive = function (controlName) {
    return (this._activeControls[controlName] === true);
};

/**
 * Register a key or keys under a control name.
 * @param {string}          controlName The name of the control, e.g. "jump" or
 *                                      "left".
 * @param {number[]|number} keyCodes    The key code or an array of key codes to
 *                                      register under the specified control 
 *                                      name, e.g. Phaser.Keyboard.SPACEBAR
 */
Controller.prototype.addKeyboardControl = function (controlName, keyCodes) {
    if (!Array.isArray(keyCodes)) keyCodes = [keyCodes];
    for (var i = 0; i < keyCodes.length; i += 1) {
        var keyCode = keyCodes[i];
        if (this._keyboardMap[keyCode]) {
            this._keyboardMap[keyCode].push(controlName);
        } else {
            this._keyboardMap[keyCode] = [controlName];
        }
    }
};

/**
 * Register a mouse button under a control name.
 * @param {string} controlName The name of the control, e.g. "jump" or "left".
 * @param {number} mouseButton The phaser mouse button to register under the 
 *                             specified control name, e.g. 
 *                             Phaser.Pointer.LEFT_BUTTON.
 */
Controller.prototype.addMouseDownControl = function (controlName, mouseButton) {
    if (this._mouseMap[mouseButton]) {
        this._mouseMap[mouseButton].push(controlName);
    } else {
        this._mouseMap[mouseButton] = [controlName];
    }
};

/**
 * Activate the array of controls specified
 * @param  {string[]} controls Array of controls to active
 * @private
 */
Controller.prototype._activateControls = function (controls) {
    for (var i = 0; i < controls.length; i += 1) {
        var controlName = controls[i];
        this._activeControls[controlName] = true;
    }
};

},{}],7:[function(require,module,exports){
var GameState = require("./states/game-state.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");

// var gameContainer = document.getElementById("game-container");
var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container");
game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("game", GameState);
game.state.start("boot");
},{"./states/boot-state.js":8,"./states/game-state.js":9,"./states/load-state.js":10}],8:[function(require,module,exports){
/**
 * BootState
 * - Sets any global settings for the game
 * - Loads only the assets needed for the LoadState
 */

module.exports = BootState;

function BootState() {}

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
},{}],9:[function(require,module,exports){
/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/seeker-enemy.js");
var Reticule = require("../game-objects/reticule.js");

function GameState() {}

GameState.prototype.create = function () {
    // Initialize the world
    this.stage.backgroundColor = "#F9F9F9";
    this.world.resize(2000, 2000);

    // Groups for z-index sorting and for collisions
    this.groups = {
        background: this.game.add.group(this.world, "background"),
        midground: this.game.add.group(this.world, "midground"),
        foreground: this.game.add.group(this.world, "foreground")
    };
    this.enemies = this.game.add.group(this.groups.midground, "enemies");

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.set(0);

    this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid", 
        this.groups.background);

    this.reticule = new Reticule(this, this.groups.foreground);

    this.player = new Player(this.game, this.world.centerX, this.world.centerY,
        this.groups.foreground, this.enemies, this.reticule);
    this.camera.follow(this.player);
    
    // Random enemies
    for (var i = 0; i < 300; i += 1) {
        var pos;
        do {
            pos = new Phaser.Point(this.world.randomX, this.world.randomY);
        } while (this.player.position.distance(pos) < 300);
        new Seeker(this.game, pos.x, pos.y, this.enemies, this.player);
    }
};
},{"../game-objects/player.js":3,"../game-objects/reticule.js":4,"../game-objects/seeker-enemy.js":5}],10:[function(require,module,exports){
/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState() {}

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
},{}]},{},[7])


//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL2J1bGxldC5qcyIsInNyYy9qcy9nYW1lLW9iamVjdHMvZ3VuLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy9wbGF5ZXIuanMiLCJzcmMvanMvZ2FtZS1vYmplY3RzL3JldGljdWxlLmpzIiwic3JjL2pzL2dhbWUtb2JqZWN0cy9zZWVrZXItZW5lbXkuanMiLCJzcmMvanMvaGVscGVycy9jb250cm9sbGVyLmpzIiwic3JjL2pzL21haW4uanMiLCJzcmMvanMvc3RhdGVzL2Jvb3Qtc3RhdGUuanMiLCJzcmMvanMvc3RhdGVzL2dhbWUtc3RhdGUuanMiLCJzcmMvanMvc3RhdGVzL2xvYWQtc3RhdGUuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2xDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2pEQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDckdBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNuREE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzFIQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUNUQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDOUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJtYWluLmpzIiwic291cmNlUm9vdCI6Ii9zb3VyY2UvIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCJtb2R1bGUuZXhwb3J0cyA9IEJ1bGxldDtcclxuXHJcbkJ1bGxldC5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuQnVsbGV0LnByb3RvdHlwZS5jb25zdHJ1Y3RvciA9IEJ1bGxldDtcclxuXHJcbmZ1bmN0aW9uIEJ1bGxldChnYW1lLCB4LCB5LCBwYXJlbnRHcm91cCwgYW5nbGUsIGVuZW1pZXMpIHtcclxuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBcImJ1bGxldFwiKTtcclxuICAgIHRoaXMuYW5jaG9yLnNldCgwLjUpO1xyXG4gICAgcGFyZW50R3JvdXAuYWRkKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX2VuZW1pZXMgPSBlbmVtaWVzO1xyXG4gICAgdGhpcy5fc3BlZWQgPSAzMDA7XHJcbiAgICB0aGlzLl9yYW5nZSA9IDUwMDtcclxuICAgIHRoaXMuX2luaXRpYWxQb3MgPSB0aGlzLnBvc2l0aW9uLmNsb25lKCk7XHJcblxyXG4gICAgLy8gUm90YXRlIGJ1bGxldCB0byBmYWNlIGluIHRoZSByaWdodCBkaXJlY3Rpb24uIFRoZSBidWxsZXQgaW1hZ2UgaXMgc2F2ZWRcclxuICAgIC8vIGZhY2luZyB1cCAoOTAgZGVncmVlcyksIHNvIHdlIG5lZWQgdG8gb2Zmc2V0IHRoZSBhbmdsZVxyXG4gICAgdGhpcy5yb3RhdGlvbiA9IGFuZ2xlICsgTWF0aC5QSSAvIDI7IC8vIFJhZGlhbnNcclxuICAgIFxyXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzKTtcclxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS52ZWxvY2l0eUZyb21BbmdsZShhbmdsZSAqIDE4MCAvIE1hdGguUEksIFxyXG4gICAgICAgIHRoaXMuX3NwZWVkLCB0aGlzLmJvZHkudmVsb2NpdHkpO1xyXG59XHJcblxyXG5CdWxsZXQucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuZ2FtZS5waHlzaWNzLmFyY2FkZS5vdmVybGFwKHRoaXMsIHRoaXMuX2VuZW1pZXMsXHJcbiAgICAgICAgdGhpcy5fb25Db2xsaWRlV2l0aEVuZW15LCBudWxsLCB0aGlzKTtcclxuICAgIGlmICh0aGlzLnBvc2l0aW9uLmRpc3RhbmNlKHRoaXMuX2luaXRpYWxQb3MpID4gdGhpcy5fcmFuZ2UpIHtcclxuICAgICAgICB0aGlzLmRlc3Ryb3koKTtcclxuICAgIH1cclxufTtcclxuXHJcbkJ1bGxldC5wcm90b3R5cGUuX29uQ29sbGlkZVdpdGhFbmVteSA9IGZ1bmN0aW9uIChzZWxmLCBlbmVteSkge1xyXG4gICAgZW5lbXkuZGVzdHJveSgpO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gR3VuO1xyXG5cclxudmFyIEJ1bGxldCA9IHJlcXVpcmUoXCIuL2J1bGxldC5qc1wiKTtcclxuXHJcbkd1bi5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5Hcm91cC5wcm90b3R5cGUpO1xyXG5HdW4ucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gR3VuO1xyXG5cclxuZnVuY3Rpb24gR3VuKGdhbWUsIHBhcmVudEdyb3VwLCBwbGF5ZXIsIGVuZW1pZXMpIHtcclxuICAgIFBoYXNlci5Hcm91cC5jYWxsKHRoaXMsIGdhbWUsIHBhcmVudEdyb3VwLCBcImJ1bGxldFwiKTtcclxuXHJcbiAgICB0aGlzLl9wbGF5ZXIgPSBwbGF5ZXI7XHJcbiAgICB0aGlzLl9lbmVtaWVzID0gZW5lbWllcztcclxuXHJcbiAgICAvLyBTZXQgdXAgYSB0aW1lciB0aGF0IGRvZXNuJ3QgYXV0b2Rlc3Ryb3kgaXRzZWxmXHJcbiAgICB0aGlzLl9idWxsZXRDb29sZG93blRpbWVyID0gdGhpcy5nYW1lLnRpbWUuY3JlYXRlKGZhbHNlKTtcclxuICAgIHRoaXMuX2J1bGxldENvb2xkb3duVGltZXIuc3RhcnQoKTtcclxuICAgIHRoaXMuX2J1bGxldENvb2xkb3duVGltZSA9IDE1MDsgLy8gTWlsbGlzZWNvbmRzIFxyXG4gICAgdGhpcy5fYWJsZVRvRmlyZSA9IHRydWU7XHJcblxyXG4gICAgLy8gQ2xlYW4gdXBcclxuICAgIHRoaXMub25EZXN0cm95LmFkZCh0aGlzLl9vbkRlc3Ryb3ksIHRoaXMpO1xyXG59XHJcblxyXG5HdW4ucHJvdG90eXBlLmZpcmUgPSBmdW5jdGlvbiAodGFyZ2V0UG9zKSB7XHJcbiAgICBpZiAodGhpcy5fYWJsZVRvRmlyZSkge1xyXG4gICAgICAgIC8vIEZpbmQgdHJhamVjdG9yeVxyXG4gICAgICAgIHZhciBhbmdsZSA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5hbmdsZSh0YXJnZXRQb3MpOyAvLyBSYWRpYW5zXHJcbiAgICAgICAgLy8gU3RhcnQgYnVsbGV0IGluIGEgcG9zaXRpb24gYWxvbmcgdGhhdCB0cmFqZWN0b3J5LCBidXQgaW4gZnJvbnQgb2YgdGhlXHJcbiAgICAgICAgLy8gcGxheWVyXHJcbiAgICAgICAgdmFyIGJ1bGxldFBvcyA9IHRoaXMuX3BsYXllci5wb3NpdGlvbi5jbG9uZSgpO1xyXG4gICAgICAgIGJ1bGxldFBvcy54ICs9ICgwLjc1ICogdGhpcy5fcGxheWVyLndpZHRoKSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICBidWxsZXRQb3MueSArPSAoMC43NSAqIHRoaXMuX3BsYXllci53aWR0aCkgKiBNYXRoLnNpbihhbmdsZSk7XHJcbiAgICAgICAgbmV3IEJ1bGxldCh0aGlzLmdhbWUsIGJ1bGxldFBvcy54LCBidWxsZXRQb3MueSwgdGhpcywgYW5nbGUsIFxyXG4gICAgICAgICAgICB0aGlzLl9lbmVtaWVzKTtcclxuICAgICAgICB0aGlzLl9zdGFydENvb2xkb3duKCk7XHJcbiAgICB9XHJcbn07XHJcblxyXG5HdW4ucHJvdG90eXBlLl9zdGFydENvb2xkb3duID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5fYWJsZVRvRmlyZSA9IGZhbHNlO1xyXG4gICAgdGhpcy5fYnVsbGV0Q29vbGRvd25UaW1lci5hZGQodGhpcy5fYnVsbGV0Q29vbGRvd25UaW1lLCBmdW5jdGlvbiAoKSB7XHJcbiAgICAgICAgdGhpcy5fYWJsZVRvRmlyZSA9IHRydWU7XHJcbiAgICB9LCB0aGlzKTtcclxufTtcclxuXHJcbkd1bi5wcm90b3R5cGUuX29uRGVzdHJveSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFNpbmNlIHRoZSB0aW1lciBkb2Vzbid0IGRlc3Ryb3kgaXRzZWxmLCB3ZSBoYXZlIHRvIHNjaGVkdWxlIGl0c1xyXG4gICAgLy8gZGVzdHJ1Y3Rpb24gb3IgaXQgd2lsbCBzdGljayBhcm91bmQgYWZ0ZXIgdGhlIEd1biBpcyBkZXN0cm95ZWQuXHJcbiAgICB0aGlzLl9idWxsZXRDb29sZG93blRpbWVyLmRlc3Ryb3koKTtcclxufTsiLCJtb2R1bGUuZXhwb3J0cyA9IFBsYXllcjtcclxuXHJcbnZhciBDb250cm9sbGVyID0gcmVxdWlyZShcIi4uL2hlbHBlcnMvY29udHJvbGxlci5qc1wiKTtcclxudmFyIEd1biA9IHJlcXVpcmUoXCIuL2d1bi5qc1wiKTtcclxuXHJcbnZhciBBTklNX05BTUVTID0ge1xyXG4gICAgSURMRTogXCJpZGxlXCIsXHJcbiAgICBNT1ZFOiBcIm1vdmVcIlxyXG59O1xyXG5cclxuLy8gUHJvdG90eXBlIGNoYWluIC0gaW5oZXJpdHMgZnJvbSBTcHJpdGVcclxuUGxheWVyLnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xyXG5QbGF5ZXIucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUGxheWVyOyAvLyBNYWtlIHN1cmUgY29uc3RydWN0b3IgcmVhZHMgcHJvcGVybHlcclxuXHJcbmZ1bmN0aW9uIFBsYXllcihnYW1lLCB4LCB5LCBwYXJlbnRHcm91cCwgZW5lbWllcywgcmV0aWN1bGUpIHtcclxuICAgIC8vIENhbGwgdGhlIHNwcml0ZSBjb25zdHJ1Y3RvciwgYnV0IGluc3RlYWQgb2YgaXQgY3JlYXRpbmcgYSBuZXcgb2JqZWN0LCBpdFxyXG4gICAgLy8gbW9kaWZpZXMgdGhlIGN1cnJlbnQgXCJ0aGlzXCIgb2JqZWN0XHJcbiAgICBQaGFzZXIuU3ByaXRlLmNhbGwodGhpcywgZ2FtZSwgeCwgeSwgXCJhc3NldHNcIiwgXCJwbGF5ZXIvaWRsZS0wMVwiKTtcclxuICAgIHRoaXMuYW5jaG9yLnNldCgwLjUpO1xyXG4gICAgcGFyZW50R3JvdXAuYWRkKHRoaXMpO1xyXG5cclxuICAgIHRoaXMuX3JldGljdWxlID0gcmV0aWN1bGU7XHJcbiAgICB0aGlzLl9lbmVtaWVzID0gZW5lbWllcztcclxuXHJcbiAgICB0aGlzLl9ndW4gPSBuZXcgR3VuKGdhbWUsIHBhcmVudEdyb3VwLCB0aGlzLCBlbmVtaWVzKTtcclxuXHJcbiAgICAvLyBTZXR1cCBhbmltYXRpb25zXHJcbiAgICB2YXIgaWRsZUZyYW1lcyA9IFBoYXNlci5BbmltYXRpb24uZ2VuZXJhdGVGcmFtZU5hbWVzKFwicGxheWVyL2lkbGUtXCIsIDEsIDQsIFxyXG4gICAgICAgIFwiXCIsIDIpO1xyXG4gICAgdmFyIG1vdmVGcmFtZXMgPSBQaGFzZXIuQW5pbWF0aW9uLmdlbmVyYXRlRnJhbWVOYW1lcyhcInBsYXllci9tb3ZlLVwiLCAxLCA0LCBcclxuICAgICAgICBcIlwiLCAyKTtcclxuICAgIHRoaXMuYW5pbWF0aW9ucy5hZGQoQU5JTV9OQU1FUy5JRExFLCBpZGxlRnJhbWVzLCAxMCwgdHJ1ZSk7XHJcbiAgICB0aGlzLmFuaW1hdGlvbnMuYWRkKEFOSU1fTkFNRVMuTU9WRSwgbW92ZUZyYW1lcywgMTAsIHRydWUpO1xyXG4gICAgdGhpcy5hbmltYXRpb25zLnBsYXkoQU5JTV9OQU1FUy5JRExFKTtcclxuXHJcbiAgICAvLyBDb25maWd1cmUgcGxheWVyIHBoeXNpY3NcclxuICAgIHRoaXMuX21heFNwZWVkID0gMTAwO1xyXG4gICAgdGhpcy5fbWF4QWNjZWxlcmF0aW9uID0gNTAwMDtcclxuICAgIHRoaXMuX21heERyYWcgPSA0MDAwO1xyXG4gICAgZ2FtZS5waHlzaWNzLmFyY2FkZS5lbmFibGUodGhpcyk7XHJcbiAgICB0aGlzLmJvZHkuY29sbGlkZVdvcmxkQm91bmRzID0gdHJ1ZTtcclxuICAgIHRoaXMuYm9keS5kcmFnLnNldCh0aGlzLl9tYXhEcmFnLCB0aGlzLl9tYXhEcmFnKTtcclxuICAgIHRoaXMuYm9keS5zZXRDaXJjbGUodGhpcy53aWR0aCAvIDIgKiAwLjUpOyAvLyBGdWRnZSBmYWN0b3JcclxuXHJcbiAgICAvLyBQbGF5ZXIgY29udHJvbHNcclxuICAgIHRoaXMuX2NvbnRyb2xzID0gbmV3IENvbnRyb2xsZXIodGhpcy5nYW1lLmlucHV0KTtcclxuICAgIHZhciBLYiA9IFBoYXNlci5LZXlib2FyZDtcclxuICAgIHRoaXMuX2NvbnRyb2xzLmFkZEtleWJvYXJkQ29udHJvbChcInVwXCIsIFtLYi5XLCBLYi5VUF0pO1xyXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwibGVmdFwiLCBbS2IuQSwgS2IuTEVGVF0pO1xyXG4gICAgdGhpcy5fY29udHJvbHMuYWRkS2V5Ym9hcmRDb250cm9sKFwicmlnaHRcIiwgW0tiLkQsIEtiLlJJR0hUXSk7XHJcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJkb3duXCIsIFtLYi5TLCBLYi5ET1dOXSk7XHJcbiAgICB0aGlzLl9jb250cm9scy5hZGRLZXlib2FyZENvbnRyb2woXCJmaXJlXCIsIFtLYi5TUEFDRUJBUl0pO1xyXG4gICAgdGhpcy5fY29udHJvbHMuYWRkTW91c2VEb3duQ29udHJvbChcImZpcmVcIiwgUGhhc2VyLlBvaW50ZXIuTEVGVF9CVVRUT04pO1xyXG59XHJcblxyXG5QbGF5ZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX2NvbnRyb2xzLnVwZGF0ZSgpO1xyXG5cclxuICAgIC8vIENhbGN1bGF0ZSB0aGUgcGxheWVyJ3MgbmV3IGFjY2VsZXJhdGlvbi4gSXQgc2hvdWxkIGJlIHplcm8gaWYgbm8ga2V5cyBhcmVcclxuICAgIC8vIHByZXNzZWQgLSBhbGxvd3MgZm9yIHF1aWNrIHN0b3BwaW5nLlxyXG4gICAgdmFyIGFjY2VsZXJhdGlvbiA9IG5ldyBQaGFzZXIuUG9pbnQoMCwgMCk7XHJcblxyXG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcImxlZnRcIikpIGFjY2VsZXJhdGlvbi54ID0gLTE7XHJcbiAgICBlbHNlIGlmICh0aGlzLl9jb250cm9scy5pc0NvbnRyb2xBY3RpdmUoXCJyaWdodFwiKSkgYWNjZWxlcmF0aW9uLnggPSAxO1xyXG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcInVwXCIpKSBhY2NlbGVyYXRpb24ueSA9IC0xO1xyXG4gICAgZWxzZSBpZiAodGhpcy5fY29udHJvbHMuaXNDb250cm9sQWN0aXZlKFwiZG93blwiKSkgYWNjZWxlcmF0aW9uLnkgPSAxO1xyXG5cclxuICAgIC8vIENoZWNrIHdoZXRoZXIgcGxheWVyIGlzIG1vdmluZyBpbiBvcmRlciB0byB1cGRhdGUgaXRzIGFuaW1hdGlvblxyXG4gICAgdmFyIGlzSWRsZSA9IGFjY2VsZXJhdGlvbi5pc1plcm8oKTsgXHJcbiAgICBpZiAoaXNJZGxlICYmIHRoaXMuYW5pbWF0aW9ucy5uYW1lICE9PSBBTklNX05BTUVTLklETEUpIHtcclxuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLklETEUpO1xyXG4gICAgfSBlbHNlIGlmICghaXNJZGxlICYmIHRoaXMuYW5pbWF0aW9ucy5uYW1lICE9PSBBTklNX05BTUVTLk1PVkUpIHtcclxuICAgICAgICB0aGlzLmFuaW1hdGlvbnMucGxheShBTklNX05BTUVTLk1PVkUpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIE5vcm1hbGl6ZSB0aGUgYWNjZWxlcmF0aW9uIGFuZCBzZXQgdGhlIG1hZ25pdHVkZS4gVGhpcyBtYWtlcyBpdCBzbyB0aGF0XHJcbiAgICAvLyB0aGUgcGxheWVyIG1vdmVzIGluIHRoZSBzYW1lIHNwZWVkIGluIGFsbCBkaXJlY3Rpb25zLlxyXG4gICAgYWNjZWxlcmF0aW9uID0gYWNjZWxlcmF0aW9uLnNldE1hZ25pdHVkZSh0aGlzLl9tYXhBY2NlbGVyYXRpb24pO1xyXG4gICAgdGhpcy5ib2R5LmFjY2VsZXJhdGlvbi5jb3B5RnJvbShhY2NlbGVyYXRpb24pO1xyXG5cclxuICAgIC8vIENhcCB0aGUgdmVsb2NpdHkuIFBoYXNlciBwaHlzaWNzJ3MgbWF4IHZlbG9jaXR5IGNhcHMgdGhlIHZlbG9jaXR5IGluIHRoZVxyXG4gICAgLy8geCAmIHkgZGltZW5zaW9ucyBzZXBhcmF0ZWx5LiBUaGlzIGFsbG93cyB0aGUgc3ByaXRlIHRvIG1vdmUgZmFzdGVyIGFsb25nXHJcbiAgICAvLyBhIGRpYWdvbmFsIHRoYW4gaXQgd291bGQgYWxvbmcgdGhlIHggb3IgeSBheGlzLiBUbyBmaXggdGhhdCwgd2UgbmVlZCB0b1xyXG4gICAgLy8gY2FwIHRoZSB2ZWxvY2l0eSBiYXNlZCBvbiBpdCdzIG1hZ25pdHVkZS5cclxuICAgIGlmICh0aGlzLmJvZHkudmVsb2NpdHkuZ2V0TWFnbml0dWRlKCkgPiB0aGlzLl9tYXhTcGVlZCkge1xyXG4gICAgICAgIHRoaXMuYm9keS52ZWxvY2l0eS5zZXRNYWduaXR1ZGUodGhpcy5fbWF4U3BlZWQpO1xyXG4gICAgfVxyXG5cclxuICAgIC8vIEZpcmluZyBsb2dpY1xyXG4gICAgaWYgKHRoaXMuX2NvbnRyb2xzLmlzQ29udHJvbEFjdGl2ZShcImZpcmVcIikpIHtcclxuICAgICAgICB0aGlzLl9ndW4uZmlyZSh0aGlzLl9yZXRpY3VsZS5wb3NpdGlvbik7XHJcbiAgICB9XHJcblxyXG4gICAgLy8gRW5lbXkgY29sbGlzaW9uc1xyXG4gICAgdGhpcy5nYW1lLnBoeXNpY3MuYXJjYWRlLm92ZXJsYXAodGhpcywgdGhpcy5fZW5lbWllcywgXHJcbiAgICAgICAgdGhpcy5fb25Db2xsaWRlV2l0aEVuZW15LCBudWxsLCB0aGlzKTtcclxufTtcclxuXHJcblBsYXllci5wcm90b3R5cGUuX29uQ29sbGlkZVdpdGhFbmVteSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEhhY2t5IHJlc3RhcnQgKGZvciBub3cpXHJcbiAgICB0aGlzLmdhbWUuc3RhdGUucmVzdGFydCgpO1xyXG59OyIsIm1vZHVsZS5leHBvcnRzID0gUmV0aWN1bGU7XHJcblxyXG5SZXRpY3VsZS5wcm90b3R5cGUgPSBPYmplY3QuY3JlYXRlKFBoYXNlci5TcHJpdGUucHJvdG90eXBlKTtcclxuUmV0aWN1bGUucHJvdG90eXBlLmNvbnN0cnVjdG9yID0gUmV0aWN1bGU7XHJcblxyXG5mdW5jdGlvbiBSZXRpY3VsZShnYW1lLCBwYXJlbnRHcm91cCkge1xyXG4gICAgUGhhc2VyLlNwcml0ZS5jYWxsKHRoaXMsIGdhbWUsIDAsIDAsIFwiYXNzZXRzXCIsIFwicmV0aWN1bGVcIik7XHJcbiAgICB0aGlzLmFuY2hvci5zZXQoMC41KTtcclxuICAgIHBhcmVudEdyb3VwLmFkZCh0aGlzKTtcclxuICAgIFxyXG4gICAgdGhpcy5fdXBkYXRlUG9zaXRpb24oKTtcclxufVxyXG5cclxuUmV0aWN1bGUucHJvdG90eXBlLl91cGRhdGVQb3NpdGlvbiA9IGZ1bmN0aW9uKCkge1xyXG4gICAgdmFyIG5ld1BvcyA9IFBoYXNlci5Qb2ludC5hZGQodGhpcy5nYW1lLmNhbWVyYS5wb3NpdGlvbiwgXHJcbiAgICAgICAgdGhpcy5nYW1lLmlucHV0LmFjdGl2ZVBvaW50ZXIpO1xyXG4gICAgdGhpcy5wb3NpdGlvbi5jb3B5RnJvbShuZXdQb3MpO1xyXG59O1xyXG5cclxuUmV0aWN1bGUucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIHRoaXMuX3VwZGF0ZVBvc2l0aW9uKCk7XHJcbn07IiwibW9kdWxlLmV4cG9ydHMgPSBTZWVrZXJFbmVteTtcclxuXHJcbi8vIFByb3RvdHlwZSBjaGFpbiAtIGluaGVyaXRzIGZyb20gU3ByaXRlXHJcblNlZWtlckVuZW15LnByb3RvdHlwZSA9IE9iamVjdC5jcmVhdGUoUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUpO1xyXG5TZWVrZXJFbmVteS5wcm90b3R5cGUuY29uc3RydWN0b3IgPSBTZWVrZXJFbmVteTtcclxuXHJcbmZ1bmN0aW9uIFNlZWtlckVuZW15KGdhbWUsIHgsIHksIHBhcmVudEdyb3VwLCB0YXJnZXQpIHtcclxuICAgIFBoYXNlci5TcHJpdGUuY2FsbCh0aGlzLCBnYW1lLCB4LCB5LCBcImFzc2V0c1wiLCBcImVuZW15L2lkbGUtMDFcIik7XHJcbiAgICB0aGlzLmFuY2hvci5zZXQoMC41KTtcclxuICAgIHBhcmVudEdyb3VwLmFkZCh0aGlzKTtcclxuICAgIFxyXG4gICAgLy8gR2l2ZSB0aGUgc3ByaXRlIGEgcmFuZG9tIHRpbnRcclxuICAgIHZhciByYW5kTGlnaHRuZXNzID0gdGhpcy5nYW1lLnJuZC5yZWFsSW5SYW5nZSgwLjQsIDAuNik7XHJcbiAgICB2YXIgcmdiID0gUGhhc2VyLkNvbG9yLkhTTHRvUkdCKDAuOTgsIDEsIHJhbmRMaWdodG5lc3MpO1xyXG4gICAgdGhpcy50aW50ID0gUGhhc2VyLkNvbG9yLmdldENvbG9yKHJnYi5yLCByZ2IuZywgcmdiLmIpO1xyXG5cclxuICAgIHRoaXMuX3RhcmdldCA9IHRhcmdldDtcclxuICAgIHRoaXMuX3Zpc2lvblJhZGl1cyA9IDMwMDtcclxuXHJcbiAgICAvLyBDb25maWd1cmUgcGxheWVyIHBoeXNpY3NcclxuICAgIHRoaXMuX21heFNwZWVkID0gMjAwO1xyXG4gICAgdGhpcy5fbWF4RHJhZyA9IDQwMDA7XHJcbiAgICBnYW1lLnBoeXNpY3MuYXJjYWRlLmVuYWJsZSh0aGlzKTtcclxuICAgIHRoaXMuYm9keS5jb2xsaWRlV29ybGRCb3VuZHMgPSB0cnVlO1xyXG4gICAgdGhpcy5ib2R5LmRyYWcuc2V0KHRoaXMuX21heERyYWcsIHRoaXMuX21heERyYWcpO1xyXG4gICAgdGhpcy5ib2R5LnNldENpcmNsZSh0aGlzLndpZHRoIC8gMiAqIDAuOCk7IC8vIEZ1ZGdlIGZhY3RvclxyXG59XHJcblxyXG4vKipcclxuICogT3ZlcnJpZGUgcHJlVXBkYXRlIHRvIHVwZGF0ZSB2ZWxvY2l0eS4gUGh5c2ljcyB1cGRhdGVzIGhhcHBlbiBpbiBwcmVVcGRhdGUsXHJcbiAqIHNvIGlmIHRoZSB2ZWxvY2l0eSB1cGRhdGVzIGhhcHBlbmVkIEFGVEVSIHRoYXQsIHRoZSB0YXJnZXRpbmcgd291bGQgYmUgb2ZmXHJcbiAqIGJ5IGEgZnJhbWUuXHJcbiAqL1xyXG5TZWVrZXJFbmVteS5wcm90b3R5cGUucHJlVXBkYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5ib2R5LnZlbG9jaXR5LnNldCgwKTtcclxuXHJcbiAgICAvLyBDaGVjayBpZiB0YXJnZXQgaXMgd2l0aGluIHZpc3VhbCByYW5nZVxyXG4gICAgdmFyIGRpc3RhbmNlID0gdGhpcy5wb3NpdGlvbi5kaXN0YW5jZSh0aGlzLl90YXJnZXQucG9zaXRpb24pO1xyXG4gICAgaWYgKGRpc3RhbmNlIDw9IHRoaXMuX3Zpc2lvblJhZGl1cykge1xyXG4gICAgICAgIC8vIElmIHRhcmdldCBpcyBpbiByYW5nZSwgY2FsY3VsYXRlIHRoZSBhY2NlbGVyYXRpb24gYmFzZWQgb24gdGhlIFxyXG4gICAgICAgIC8vIGRpcmVjdGlvbiB0aGlzIHNwcml0ZSBuZWVkcyB0byB0cmF2ZWwgdG8gaGl0IHRoZSB0YXJnZXRcclxuICAgICAgICB2YXIgYW5nbGUgPSB0aGlzLnBvc2l0aW9uLmFuZ2xlKHRoaXMuX3RhcmdldC5wb3NpdGlvbik7XHJcbiAgICAgICAgdmFyIHRhcmdldFNwZWVkID0gZGlzdGFuY2UgLyB0aGlzLmdhbWUudGltZS5waHlzaWNzRWxhcHNlZDtcclxuICAgICAgICB2YXIgbWFnbml0dWRlID0gTWF0aC5taW4odGhpcy5fbWF4U3BlZWQsIHRhcmdldFNwZWVkKTtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueCA9IG1hZ25pdHVkZSAqIE1hdGguY29zKGFuZ2xlKTtcclxuICAgICAgICB0aGlzLmJvZHkudmVsb2NpdHkueSA9IG1hZ25pdHVkZSAqIE1hdGguc2luKGFuZ2xlKTtcclxuICAgIH1cclxuXHJcbiAgICAvLyBDYWxsIHRoZSBwYXJlbnQncyBwcmVVcGRhdGUgYW5kIHJldHVybiB0aGUgdmFsdWUuIFNvbWV0aGluZyBlbHNlIGluXHJcbiAgICAvLyBQaGFzZXIgbWlnaHQgdXNlIGl0Li4uXHJcbiAgICByZXR1cm4gUGhhc2VyLlNwcml0ZS5wcm90b3R5cGUucHJlVXBkYXRlLmNhbGwodGhpcyk7XHJcbn07IiwiLyoqXHJcbiAqIEBtb2R1bGUgQ29udHJvbGxlclxyXG4gKi9cclxubW9kdWxlLmV4cG9ydHMgPSBDb250cm9sbGVyO1xyXG5cclxuLyoqXHJcbiAqIFRoaXMgb2JqZWN0IGNhbiBiZSB1c2VkIHRvIGxvb2sgdXAgdGhlIG1vdXNlIGJ1dHRvbiBwcm9wZXJ0eSB0aGF0IGNvcnJlc3BvbmRzXHJcbiAqIHdpdGggdGhlIGJ1dHRvbidzIG51bWVyaWNhbCBJRC5cclxuICogQHR5cGUge09iamVjdH1cclxuICovXHJcbnZhciBQT0lOVEVSX0JVVFRPTlNfTE9PS1VQID0ge307XHJcblBPSU5URVJfQlVUVE9OU19MT09LVVBbUGhhc2VyLlBvaW50ZXIuTEVGVF9CVVRUT05dID0gXCJsZWZ0QnV0dG9uXCI7XHJcblBPSU5URVJfQlVUVE9OU19MT09LVVBbUGhhc2VyLlBvaW50ZXIuTUlERExFX0JVVFRPTl0gPSBcIm1pZGRsZUJ1dHRvblwiO1xyXG5QT0lOVEVSX0JVVFRPTlNfTE9PS1VQW1BoYXNlci5Qb2ludGVyLlJJR0hUX0JVVFRPTl0gPSBcInJpZ2h0QnV0dG9uXCI7XHJcbiAgICBcclxuLyoqXHJcbiAqIEEgaGVscGVyIGNsYXNzIGZvciBhYnN0cmFjdGluZyBhd2F5IGEgY29udHJvbGxlci4gVGhpcyBjYW4gcmVnaXN0ZXIgbXVsdGlwbGVcclxuICogY29udHJvbCBrZXlzIHRvIHRoZSBzYW1lIGFjdGlvbiwgZS5nLiB1c2luZyBib3RoIFwibGVmdFwiIGFuZCBcIndcIiBmb3IgbW92aW5nIGFcclxuICogY2hhcmFjdGVyIGxlZnQuXHJcbiAqIEBjbGFzcyBDb250cm9sbGVyXHJcbiAqIEBjb25zdHJ1Y3RvclxyXG4gKiBAcGFyYW0ge29iamVjdH0gaW5wdXQgQSByZWZlcmVuY2UgdG8gYSBQaGFzZXIuaW5wdXQgZm9yIHRoZSBjdXJyZW50IGdhbWUuXHJcbiAqL1xyXG5mdW5jdGlvbiBDb250cm9sbGVyKGlucHV0KSB7XHJcbiAgICB0aGlzLl9pbnB1dCA9IGlucHV0O1xyXG5cclxuICAgIC8vIE9iamVjdCBjb250YWluaW5nIHRoZSBhY3RpdmUgY29udHJvbCBuYW1lcy4gSWYgYSBjb250cm9sIGlzIGFjdGl2ZSwgdGhpc1xyXG4gICAgLy8gd2lsbCBoYXZlIGEgcHJvcGVydHkgKHRoYXQgY29udHJvbCdzIG5hbWUpIHNldCB0byB0cnVlLiBJbmFjdGl2ZSBjb250cm9sc1xyXG4gICAgLy8gYXJlIG5vdCBzdG9yZWQgaW4gdGhlIG9iamVjdC5cclxuICAgIHRoaXMuX2FjdGl2ZUNvbnRyb2xzID0ge307XHJcblxyXG4gICAgLy8gT2JqZWN0cyBjb250YWluaW5nIHRoZSBtYXBwaW5nIG9mOiBcclxuICAgIC8vICBrZXlDb2RlL21vdXNlQnV0dG9uIC0+IGNvbnRyb2wgbmFtZVxyXG4gICAgdGhpcy5fa2V5Ym9hcmRNYXAgPSB7fTtcclxuICAgIHRoaXMuX21vdXNlTWFwID0ge307XHJcbn1cclxuXHJcbi8qKlxyXG4gKiBDaGVjayB3aGF0IGNvbnRyb2xzIGFyZSBhY3RpdmUuIFRoaXMgbXVzdCBiZSBjYWxsZWQgb25jZSBwZXIgZnJhbWUsIGJlZm9yZVxyXG4gKiBDb250cm9sbGVyLmlzQ29udHJvbEFjdGl2ZS5cclxuICovXHJcbkNvbnRyb2xsZXIucHJvdG90eXBlLnVwZGF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIFJlc2V0IGNvbnRyb2xzXHJcbiAgICB0aGlzLl9hY3RpdmVDb250cm9scyA9IHt9O1xyXG5cclxuICAgIC8vIENoZWNrIGZvciBhbnkgcmVnaXN0ZXJlZCBtb3VzZSBjb250cm9scyB0aGF0IGhhdmUgYmVlbiBhY3RpdmF0ZWRcclxuICAgIHZhciBhY3RpdmVQb2ludGVyID0gdGhpcy5faW5wdXQuYWN0aXZlUG9pbnRlcjtcclxuICAgIGZvciAodmFyIGJ1dHRvbk5hbWUgaW4gdGhpcy5fbW91c2VNYXApIHtcclxuICAgICAgICB2YXIgY29udHJvbHMgPSB0aGlzLl9tb3VzZU1hcFtidXR0b25OYW1lXTtcclxuICAgICAgICB2YXIgYnV0dG9uUHJvcGVydHlOYW1lID0gUE9JTlRFUl9CVVRUT05TX0xPT0tVUFtidXR0b25OYW1lXTtcclxuICAgICAgICB2YXIgcG9pbnRlckJ1dHRvbiA9IGFjdGl2ZVBvaW50ZXJbYnV0dG9uUHJvcGVydHlOYW1lXTtcclxuICAgICAgICBpZiAocG9pbnRlckJ1dHRvbi5pc0Rvd24pIHtcclxuICAgICAgICAgICAgdGhpcy5fYWN0aXZhdGVDb250cm9scyhjb250cm9scyk7XHJcbiAgICAgICAgfVxyXG4gICAgfVxyXG5cclxuICAgIC8vIENoZWNrIGZvciBhbnkgcmVnaXN0ZXJlZCBrZXlib2FyZCBjb250cm9scyB0aGF0IGhhdmUgYmVlbiBhY3RpdmF0ZWRcclxuICAgIGZvciAodmFyIGtleUNvZGUgaW4gdGhpcy5fa2V5Ym9hcmRNYXApIHtcclxuICAgICAgICB2YXIgY29udHJvbHMgPSB0aGlzLl9rZXlib2FyZE1hcFtrZXlDb2RlXTtcclxuICAgICAgICBpZiAodGhpcy5faW5wdXQua2V5Ym9hcmQuaXNEb3duKGtleUNvZGUpKSB7XHJcbiAgICAgICAgICAgIHRoaXMuX2FjdGl2YXRlQ29udHJvbHMoY29udHJvbHMpO1xyXG4gICAgICAgIH1cclxuICAgICAgICAvLyBUT0RPOiBpc0Rvd24oLi4uKSBvbmx5IHdvcmtzIGluIGJyb3dzZXJzLiBNYWtlIHRoaXMgbW9iaWxlLWZyaWVuZGx5LlxyXG4gICAgfVxyXG59O1xyXG5cclxuLyoqXHJcbiAqIENoZWNrIHdoZXRoZXIgYSBzcGVjaWZpZWQgY29udHJvbCBpcyBjdXJyZW50bHkgYWN0aXZlLlxyXG4gKiBAcGFyYW0gIHtzdHJpbmd9ICBjb250cm9sTmFtZSBUaGUgbmFtZSBvZiB0aGUgY29udHJvbCB3aGljaCB3YXMgcmVnaXN0ZXJlZCBpblxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBDb250cm9sbGVyLmFkZEtleS5cclxuICogQHJldHVybiB7Qm9vbGVhbn0gICAgICAgICAgICAgV2hldGhlciBvciBub3QgdGhlIGNvbnRyb2wgaXMgYWN0aXZlLlxyXG4gKi9cclxuQ29udHJvbGxlci5wcm90b3R5cGUuaXNDb250cm9sQWN0aXZlID0gZnVuY3Rpb24gKGNvbnRyb2xOYW1lKSB7XHJcbiAgICByZXR1cm4gKHRoaXMuX2FjdGl2ZUNvbnRyb2xzW2NvbnRyb2xOYW1lXSA9PT0gdHJ1ZSk7XHJcbn07XHJcblxyXG4vKipcclxuICogUmVnaXN0ZXIgYSBrZXkgb3Iga2V5cyB1bmRlciBhIGNvbnRyb2wgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmd9ICAgICAgICAgIGNvbnRyb2xOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250cm9sLCBlLmcuIFwianVtcFwiIG9yXHJcbiAqICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBcImxlZnRcIi5cclxuICogQHBhcmFtIHtudW1iZXJbXXxudW1iZXJ9IGtleUNvZGVzICAgIFRoZSBrZXkgY29kZSBvciBhbiBhcnJheSBvZiBrZXkgY29kZXMgdG9cclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJlZ2lzdGVyIHVuZGVyIHRoZSBzcGVjaWZpZWQgY29udHJvbCBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUsIGUuZy4gUGhhc2VyLktleWJvYXJkLlNQQUNFQkFSXHJcbiAqL1xyXG5Db250cm9sbGVyLnByb3RvdHlwZS5hZGRLZXlib2FyZENvbnRyb2wgPSBmdW5jdGlvbiAoY29udHJvbE5hbWUsIGtleUNvZGVzKSB7XHJcbiAgICBpZiAoIUFycmF5LmlzQXJyYXkoa2V5Q29kZXMpKSBrZXlDb2RlcyA9IFtrZXlDb2Rlc107XHJcbiAgICBmb3IgKHZhciBpID0gMDsgaSA8IGtleUNvZGVzLmxlbmd0aDsgaSArPSAxKSB7XHJcbiAgICAgICAgdmFyIGtleUNvZGUgPSBrZXlDb2Rlc1tpXTtcclxuICAgICAgICBpZiAodGhpcy5fa2V5Ym9hcmRNYXBba2V5Q29kZV0pIHtcclxuICAgICAgICAgICAgdGhpcy5fa2V5Ym9hcmRNYXBba2V5Q29kZV0ucHVzaChjb250cm9sTmFtZSk7XHJcbiAgICAgICAgfSBlbHNlIHtcclxuICAgICAgICAgICAgdGhpcy5fa2V5Ym9hcmRNYXBba2V5Q29kZV0gPSBbY29udHJvbE5hbWVdO1xyXG4gICAgICAgIH1cclxuICAgIH1cclxufTtcclxuXHJcbi8qKlxyXG4gKiBSZWdpc3RlciBhIG1vdXNlIGJ1dHRvbiB1bmRlciBhIGNvbnRyb2wgbmFtZS5cclxuICogQHBhcmFtIHtzdHJpbmd9IGNvbnRyb2xOYW1lIFRoZSBuYW1lIG9mIHRoZSBjb250cm9sLCBlLmcuIFwianVtcFwiIG9yIFwibGVmdFwiLlxyXG4gKiBAcGFyYW0ge251bWJlcn0gbW91c2VCdXR0b24gVGhlIHBoYXNlciBtb3VzZSBidXR0b24gdG8gcmVnaXN0ZXIgdW5kZXIgdGhlIFxyXG4gKiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc3BlY2lmaWVkIGNvbnRyb2wgbmFtZSwgZS5nLiBcclxuICogICAgICAgICAgICAgICAgICAgICAgICAgICAgIFBoYXNlci5Qb2ludGVyLkxFRlRfQlVUVE9OLlxyXG4gKi9cclxuQ29udHJvbGxlci5wcm90b3R5cGUuYWRkTW91c2VEb3duQ29udHJvbCA9IGZ1bmN0aW9uIChjb250cm9sTmFtZSwgbW91c2VCdXR0b24pIHtcclxuICAgIGlmICh0aGlzLl9tb3VzZU1hcFttb3VzZUJ1dHRvbl0pIHtcclxuICAgICAgICB0aGlzLl9tb3VzZU1hcFttb3VzZUJ1dHRvbl0ucHVzaChjb250cm9sTmFtZSk7XHJcbiAgICB9IGVsc2Uge1xyXG4gICAgICAgIHRoaXMuX21vdXNlTWFwW21vdXNlQnV0dG9uXSA9IFtjb250cm9sTmFtZV07XHJcbiAgICB9XHJcbn07XHJcblxyXG4vKipcclxuICogQWN0aXZhdGUgdGhlIGFycmF5IG9mIGNvbnRyb2xzIHNwZWNpZmllZFxyXG4gKiBAcGFyYW0gIHtzdHJpbmdbXX0gY29udHJvbHMgQXJyYXkgb2YgY29udHJvbHMgdG8gYWN0aXZlXHJcbiAqIEBwcml2YXRlXHJcbiAqL1xyXG5Db250cm9sbGVyLnByb3RvdHlwZS5fYWN0aXZhdGVDb250cm9scyA9IGZ1bmN0aW9uIChjb250cm9scykge1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCBjb250cm9scy5sZW5ndGg7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBjb250cm9sTmFtZSA9IGNvbnRyb2xzW2ldO1xyXG4gICAgICAgIHRoaXMuX2FjdGl2ZUNvbnRyb2xzW2NvbnRyb2xOYW1lXSA9IHRydWU7XHJcbiAgICB9XHJcbn07XHJcbiIsInZhciBHYW1lU3RhdGUgPSByZXF1aXJlKFwiLi9zdGF0ZXMvZ2FtZS1zdGF0ZS5qc1wiKTtcclxudmFyIEJvb3RTdGF0ZSA9IHJlcXVpcmUoXCIuL3N0YXRlcy9ib290LXN0YXRlLmpzXCIpO1xyXG52YXIgTG9hZFN0YXRlID0gcmVxdWlyZShcIi4vc3RhdGVzL2xvYWQtc3RhdGUuanNcIik7XHJcblxyXG4vLyB2YXIgZ2FtZUNvbnRhaW5lciA9IGRvY3VtZW50LmdldEVsZW1lbnRCeUlkKFwiZ2FtZS1jb250YWluZXJcIik7XHJcbnZhciBnYW1lID0gbmV3IFBoYXNlci5HYW1lKDgwMCwgNjAwLCBQaGFzZXIuQVVUTywgXCJnYW1lLWNvbnRhaW5lclwiKTtcclxuZ2FtZS5zdGF0ZS5hZGQoXCJib290XCIsIEJvb3RTdGF0ZSk7XHJcbmdhbWUuc3RhdGUuYWRkKFwibG9hZFwiLCBMb2FkU3RhdGUpO1xyXG5nYW1lLnN0YXRlLmFkZChcImdhbWVcIiwgR2FtZVN0YXRlKTtcclxuZ2FtZS5zdGF0ZS5zdGFydChcImJvb3RcIik7IiwiLyoqXHJcbiAqIEJvb3RTdGF0ZVxyXG4gKiAtIFNldHMgYW55IGdsb2JhbCBzZXR0aW5ncyBmb3IgdGhlIGdhbWVcclxuICogLSBMb2FkcyBvbmx5IHRoZSBhc3NldHMgbmVlZGVkIGZvciB0aGUgTG9hZFN0YXRlXHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBCb290U3RhdGU7XHJcblxyXG5mdW5jdGlvbiBCb290U3RhdGUoKSB7fVxyXG5cclxuQm9vdFN0YXRlLnByb3RvdHlwZS5jcmVhdGUgPSBmdW5jdGlvbiAoKSB7XHJcbiAgICAvLyBUYWtlIGNhcmUgb2YgYW55IGdsb2JhbCBnYW1lIHNldHRpbmdzIHRoYXQgbmVlZCB0byBiZSBzZXQgdXBcclxuICAgIC8vIE1ha2Ugc3VyZSB0aGF0IHNwcml0ZXMgYXJlIGRyYXduIGF0IGludGVnZXIgcG9zaXRpb25zIC0gdG8gYXZvaWQgXHJcbiAgICAvLyBzdWItcGl4ZWwgcG9zaXRpb24gYmx1cnJpbmdcclxuICAgIHRoaXMuZ2FtZS5yZW5kZXJlci5yZW5kZXJTZXNzaW9uLnJvdW5kUGl4ZWxzID0gdHJ1ZTtcclxuICAgIC8vIERpc2FibGUgY3Vyc29yXHJcbiAgICB0aGlzLmdhbWUuY2FudmFzLnN0eWxlLmN1cnNvciA9IFwibm9uZVwiO1xyXG4gICAgLy8gRGlzYWJsZSB0aGUgYnVpbHQtaW4gcGF1c2luZy4gVGhpcyBpcyB1c2VmdWwgZm9yIGRlYnVnZ2luZywgYnV0IG1heSBhbHNvXHJcbiAgICAvLyBiZSB1c2VmdWwgZm9yIHRoZSBnYW1lIGxvZ2ljXHJcbiAgICB0aGlzLnN0YWdlLmRpc2FibGVWaXNpYmlsaXR5Q2hhbmdlID0gdHJ1ZTtcclxuICAgIHRoaXMuc3RhZ2UuYmFja2dyb3VuZENvbG9yID0gXCIjRjlGOUY5XCI7XHJcblxyXG4gICAgdGhpcy5nYW1lLnN0YXRlLnN0YXJ0KFwibG9hZFwiKTtcclxufTsiLCIvKipcclxuICogR2FtZVN0YXRlIC0gdGhpcyBpcyB0aGUgbWFpbiBsZXZlbCBmb3Igbm93XHJcbiAqL1xyXG5cclxubW9kdWxlLmV4cG9ydHMgPSBHYW1lU3RhdGU7XHJcblxyXG52YXIgUGxheWVyID0gcmVxdWlyZShcIi4uL2dhbWUtb2JqZWN0cy9wbGF5ZXIuanNcIik7XHJcbnZhciBTZWVrZXIgPSByZXF1aXJlKFwiLi4vZ2FtZS1vYmplY3RzL3NlZWtlci1lbmVteS5qc1wiKTtcclxudmFyIFJldGljdWxlID0gcmVxdWlyZShcIi4uL2dhbWUtb2JqZWN0cy9yZXRpY3VsZS5qc1wiKTtcclxuXHJcbmZ1bmN0aW9uIEdhbWVTdGF0ZSgpIHt9XHJcblxyXG5HYW1lU3RhdGUucHJvdG90eXBlLmNyZWF0ZSA9IGZ1bmN0aW9uICgpIHtcclxuICAgIC8vIEluaXRpYWxpemUgdGhlIHdvcmxkXHJcbiAgICB0aGlzLnN0YWdlLmJhY2tncm91bmRDb2xvciA9IFwiI0Y5RjlGOVwiO1xyXG4gICAgdGhpcy53b3JsZC5yZXNpemUoMjAwMCwgMjAwMCk7XHJcblxyXG4gICAgLy8gR3JvdXBzIGZvciB6LWluZGV4IHNvcnRpbmcgYW5kIGZvciBjb2xsaXNpb25zXHJcbiAgICB0aGlzLmdyb3VwcyA9IHtcclxuICAgICAgICBiYWNrZ3JvdW5kOiB0aGlzLmdhbWUuYWRkLmdyb3VwKHRoaXMud29ybGQsIFwiYmFja2dyb3VuZFwiKSxcclxuICAgICAgICBtaWRncm91bmQ6IHRoaXMuZ2FtZS5hZGQuZ3JvdXAodGhpcy53b3JsZCwgXCJtaWRncm91bmRcIiksXHJcbiAgICAgICAgZm9yZWdyb3VuZDogdGhpcy5nYW1lLmFkZC5ncm91cCh0aGlzLndvcmxkLCBcImZvcmVncm91bmRcIilcclxuICAgIH07XHJcbiAgICB0aGlzLmVuZW1pZXMgPSB0aGlzLmdhbWUuYWRkLmdyb3VwKHRoaXMuZ3JvdXBzLm1pZGdyb3VuZCwgXCJlbmVtaWVzXCIpO1xyXG5cclxuICAgIC8vIFBoeXNpY3NcclxuICAgIHRoaXMucGh5c2ljcy5zdGFydFN5c3RlbShQaGFzZXIuUGh5c2ljcy5BUkNBREUpO1xyXG4gICAgdGhpcy5waHlzaWNzLmFyY2FkZS5ncmF2aXR5LnNldCgwKTtcclxuXHJcbiAgICB0aGlzLmFkZC50aWxlU3ByaXRlKDAsIDAsIDIwMDAsIDIwMDAsIFwiYXNzZXRzXCIsIFwiZ3JpZFwiLCBcclxuICAgICAgICB0aGlzLmdyb3Vwcy5iYWNrZ3JvdW5kKTtcclxuXHJcbiAgICB0aGlzLnJldGljdWxlID0gbmV3IFJldGljdWxlKHRoaXMsIHRoaXMuZ3JvdXBzLmZvcmVncm91bmQpO1xyXG5cclxuICAgIHRoaXMucGxheWVyID0gbmV3IFBsYXllcih0aGlzLmdhbWUsIHRoaXMud29ybGQuY2VudGVyWCwgdGhpcy53b3JsZC5jZW50ZXJZLFxyXG4gICAgICAgIHRoaXMuZ3JvdXBzLmZvcmVncm91bmQsIHRoaXMuZW5lbWllcywgdGhpcy5yZXRpY3VsZSk7XHJcbiAgICB0aGlzLmNhbWVyYS5mb2xsb3codGhpcy5wbGF5ZXIpO1xyXG4gICAgXHJcbiAgICAvLyBSYW5kb20gZW5lbWllc1xyXG4gICAgZm9yICh2YXIgaSA9IDA7IGkgPCAzMDA7IGkgKz0gMSkge1xyXG4gICAgICAgIHZhciBwb3M7XHJcbiAgICAgICAgZG8ge1xyXG4gICAgICAgICAgICBwb3MgPSBuZXcgUGhhc2VyLlBvaW50KHRoaXMud29ybGQucmFuZG9tWCwgdGhpcy53b3JsZC5yYW5kb21ZKTtcclxuICAgICAgICB9IHdoaWxlICh0aGlzLnBsYXllci5wb3NpdGlvbi5kaXN0YW5jZShwb3MpIDwgMzAwKTtcclxuICAgICAgICBuZXcgU2Vla2VyKHRoaXMuZ2FtZSwgcG9zLngsIHBvcy55LCB0aGlzLmVuZW1pZXMsIHRoaXMucGxheWVyKTtcclxuICAgIH1cclxufTsiLCIvKipcclxuICogTG9hZFN0YXRlIC0gdGhpcyBpcyB0aGUgbG9hZGluZyBzY3JlZW5cclxuICovXHJcblxyXG5tb2R1bGUuZXhwb3J0cyA9IExvYWRTdGF0ZTtcclxuXHJcbmZ1bmN0aW9uIExvYWRTdGF0ZSgpIHt9XHJcblxyXG5Mb2FkU3RhdGUucHJvdG90eXBlLnByZWxvYWQgPSBmdW5jdGlvbiAoKSB7ICAgIFxyXG4gICAgLy8gSW1hZ2VzXHJcbiAgICB0aGlzLmxvYWQuYXRsYXNKU09OSGFzaChcImFzc2V0c1wiLCBcImltYWdlcy9hdGxhc2VzL2Fzc2V0cy5wbmdcIiwgXHJcbiAgICAgICAgXCJpbWFnZXMvYXRsYXNlcy9hc3NldHMuanNvblwiKTtcclxuXHJcbiAgICAvLyBTdGFuZC1pbiBmb3IgYSBsb2FkaW5nIGJhclxyXG4gICAgdGhpcy5sb2FkaW5nVGV4dCA9IHRoaXMuYWRkLnRleHQodGhpcy53b3JsZC5jZW50ZXJYLCB0aGlzLndvcmxkLmNlbnRlclksIFxyXG4gICAgICAgIFwiMCVcIiwgeyBcclxuICAgICAgICAgICAgZm9udDogXCIyMDBweCBBcmlhbFwiLCBcclxuICAgICAgICAgICAgZmlsbDogXCIjMDAwXCIsIFxyXG4gICAgICAgICAgICBhbGlnbjogXCJjZW50ZXJcIiBcclxuICAgICAgICB9KTtcclxuICAgIHRoaXMubG9hZGluZ1RleHQuYW5jaG9yLnNldCgwLjUpO1xyXG59O1xyXG5cclxuTG9hZFN0YXRlLnByb3RvdHlwZS5sb2FkUmVuZGVyID0gZnVuY3Rpb24gKCkge1xyXG4gICAgdGhpcy5sb2FkaW5nVGV4dC5zZXRUZXh0KHRoaXMubG9hZC5wcm9ncmVzcyArIFwiJVwiKTtcclxufTtcclxuXHJcbkxvYWRTdGF0ZS5wcm90b3R5cGUuY3JlYXRlID0gZnVuY3Rpb24gKCkge1xyXG4gICAgLy8gU2luY2UgbG9hZCBwcm9ncmVzcyBtaWdodCBub3QgcmVhY2ggMTAwIGluIHRoZSBsb2FkIGxvb3AsIG1hbnVhbGx5IGRvIGl0XHJcbiAgICB0aGlzLmxvYWRpbmdUZXh0LnNldFRleHQoXCIxMDAlXCIpO1xyXG5cclxuICAgIHRoaXMuZ2FtZS5zdGF0ZS5zdGFydChcImdhbWVcIik7XHJcbn07Il19
