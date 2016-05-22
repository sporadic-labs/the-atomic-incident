module.exports = Player;

var Controller = require("../helpers/controller.js");

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object

//    Phaser.Sprite.call(this, game, x, y, "assets", "player");
    Phaser.Sprite.call(this, game, x, y, "playerAnim");

    this.anchor.set(0.5);

    // setup animations
    this._isMoving = false;
    this.animations.add('idle', [3, 4, 5, 6], 10, true);
    this.animations.add('move', [0, 1, 2, 3], 10, true);

    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    // Configure player physics
    this._maxSpeed = 100;
    this._maxAcceleration = 5000;
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

    // by default, set this._isMoving to false
    // if the player is moving, it will be set to true,
    // and then a check will be made to see if the idle animation should play
    this._isMoving = false;
    if (this._controls.isControlActive("left")) {
        acceleration.x = -1;
        this._isMoving = true;
    } else if (this._controls.isControlActive("right")) {
        acceleration.x = 1;
        this._isMoving = true;
    }
    if (this._controls.isControlActive("up")) {
        acceleration.y = -1;
        this._isMoving = true;
    } else if (this._controls.isControlActive("down")) {
        acceleration.y = 1;
        this._isMoving = true;
    }
    if (this._isMoving) {
        this.animations.play('move');
    } else {
        this.animations.play('idle');
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
};