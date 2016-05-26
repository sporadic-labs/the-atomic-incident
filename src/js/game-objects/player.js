module.exports = Player;

var Controller = require("../helpers/controller.js");
var Gun = require("./guns/gun.js");
var Laser = require("./guns/laser.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup, enemies, pickups, reticule) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._reticule = reticule;
    this._enemies = enemies;
    this._pickups = pickups;

    this._gunType = "gun";
    this._allGuns = {
        "gun": new Gun(game, parentGroup, this, this._enemies),
        "laser": new Laser(game, parentGroup, this, this._enemies)
    };

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
//        this._gun.fire(this._reticule.position);
        this._allGuns[this._gunType].fire(this._reticule.position);
    }

    // Enemy collisions
    this.game.physics.arcade.overlap(this, this._enemies, 
        this._onCollideWithEnemy, null, this);

    // Pickup collisions
    this.game.physics.arcade.overlap(this, this._pickups, 
        this._onCollideWithPickup, null, this);
};

Player.prototype._onCollideWithEnemy = function () {
    // Hacky restart (for now)
    this.game.state.restart();
};

Player.prototype._onCollideWithPickup = function (self, pickup) {
    this._gunType = pickup._type;
    pickup.destroy();
};