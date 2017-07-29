module.exports = Player;

var Controller = require("../helpers/controller.js");
var spriteUtils = require("../helpers/sprite-utilities.js");
const LightPickup = require("./pickups/light-pickup.js");

import PlayerLight from "./lights/player-light";

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move",
    ATTACK: "attack",
    HIT: "hit",
    DIE: "die"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);

/**
 * @param {Phaser.Game} game
 */
function Player(game, x, y, parentGroup, level) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._level = level;

    this.hearts = 3;
    this._isTakingDamage = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._isDead = false;

    this.ghostMode = false;

    // NOTE(rex): Not quite sure if this should be a part of the player or not...
    this.damage = 10000;

    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._effects = this.game.globals.plugins.effects;
    this._levelManager = globals.levelManager;
    this._ammoManager = globals.ammoManager;

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("player/idle-", 1, 4, "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("player/move-", 1, 4, "", 2);
    var attackFrames = Phaser.Animation.generateFrameNames("player/attack-", 2, 4, "", 2);
    var hitFrames = Phaser.Animation.generateFrameNames("player/hit-", 1, 4, "", 2);
    var dieFrames = Phaser.Animation.generateFrameNames("player/die-", 1, 4, "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 4, true);
    this.animations.add(ANIM_NAMES.ATTACK, attackFrames, 10, true);
    this.animations.add(ANIM_NAMES.HIT, hitFrames, 10, false);
    this.animations.add(ANIM_NAMES.DIE, dieFrames, 10, false);
    this.animations.play(ANIM_NAMES.IDLE);

    // Configure player physics
    this._maxSpeed = 50;
    this._customDrag = 1000;
    this._maxAcceleration = 5000;
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    var diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2,
        (this.height - diameter) / 2);

    this.satBody = globals.plugins.satBody.addCircleBody(this);

    // Lighting for player
    this._playerLight = new PlayerLight(game, this, 
        {startRadius: 300, minRadius: this.width, shrinkSpeed: 25});

    // Directional arrow, for dev purposes
    this._compass = game.make.image(0, 0, "assets", "hud/targeting-arrow");
    this._compass.scale.setTo(0.64, 0.64);
    // Set the anchor, position and rotation.
    this._compass.anchor.copyFrom(this.anchor);
    var cX = this.position.x + (0.6 * this.width) * Math.cos(this.rotation - (Math.PI/2));
    var cY = this.position.y + (0.6 * this.width) * Math.sin(this.rotation - (Math.PI/2));
    this._compass.position.copyFrom(new Phaser.Point(cX, cY));
    this._compass.rotation = this.rotation;
    // Add it to the foreground (so it is visible).
    game.globals.groups.midground.add(this._compass);

    /** PLAYER CONTROLS */
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    var P = Phaser.Pointer;

    // movement
    // wasd
    this._controls.addKeyboardControl("move-up", [Kb.W]);
    this._controls.addKeyboardControl("move-left", [Kb.A]);
    this._controls.addKeyboardControl("move-right", [Kb.D]);
    this._controls.addKeyboardControl("move-down", [Kb.S]);
    // arrows
    this._controls.addKeyboardControl("arrow-up", [Kb.UP]);
    this._controls.addKeyboardControl("arrow-left", [Kb.LEFT]);
    this._controls.addKeyboardControl("arrow-right", [Kb.RIGHT]);
    this._controls.addKeyboardControl("arrow-down", [Kb.DOWN]);

    // primary attack
    this._controls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);
    this._controls.addMouseDownControl("ability", [P.RIGHT_BUTTON]);

    // Player Sound fx
    this._hitSoud = this.game.globals.soundManager.add("smash", 0.03);
    this._hitSoud.playMultiple = true;
    this._dashSound = this.game.globals.soundManager.add("warp");
    this._dashSound.playMultiple = true;
    this.pickupSound = this.game.globals.soundManager.add("whoosh");

    this._velocity = new Phaser.Point(0, 0);
}

Player.prototype.update = function () {

    var g = this.game;

    // Update keyboard/mouse inputs
    this._controls.update();

    // Calculate the acceleration and heading from the keyboard.
    var acceleration = new Phaser.Point(0, 0);
    if (this._controls.isControlActive("move-left") ||
        this._controls.isControlActive("arrow-left")) {
        acceleration.x += -1;
    } else if (this._controls.isControlActive("move-right") ||
               this._controls.isControlActive("arrow-right")) {
        acceleration.x += 1;
    }
    if (this._controls.isControlActive("move-up") ||
        this._controls.isControlActive("arrow-up")) {
        acceleration.y += -1;
    } else if (this._controls.isControlActive("move-down") ||
               this._controls.isControlActive("arrow-down")) {
        acceleration.y += 1;
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

    // Custom drag. Arcade drag runs the calculation on each axis separately. 
    // This leads to more drag in the diagonal than in other directions.  To fix
    // that, we need to apply drag ourselves.
    // Based on: https://github.com/photonstorm/phaser/blob/v2.4.8/src/physics/arcade/World.js#L257
    if (acceleration.isZero() && !this.body.velocity.isZero()) {
        var dragMagnitude = this._customDrag * this.game.time.physicsElapsed;
        if (this.body.velocity.getMagnitude() < dragMagnitude) {
            // Snap to 0 velocity so that we avoid the drag causing the velocity
            // to flip directions and end up oscillating
            this.body.velocity.set(0);
        } else {
            // Apply drag in opposite direction of velocity
            var drag = this.body.velocity.clone()
                .setMagnitude(-1 * dragMagnitude); 
            this.body.velocity.add(drag.x, drag.y);
        }
    }

    // Check collisions with Tilemap.
    this.game.physics.arcade.collide(this, this._levelManager.getCurrentWallLayer());

    // Update velocity after collision
    Phaser.Point.subtract(this.body.position, this.body.prev, this._velocity);
    this._velocity.divide(this.game.time.physicsElapsed, this.game.time.physicsElapsed);

    // Update the rotation of the player based on the mouse
    var mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    this.rotation = this.position.angle(mousePos) + (Math.PI/2);

    // Enemy collisions
    spriteUtils.checkOverlapWithGroup(this, this._enemies,
        this._onCollideWithEnemy, this);

    // Light pickups
    spriteUtils.checkOverlapWithGroup(this, this._pickups,
        this._onCollideWithPickup, this);
};

Player.prototype.getVelocity = function () {
    return this._velocity;
};

Player.prototype.postUpdate = function () {
    // Update light placement
    this._playerLight.centerOnPlayer();

    // Update compass position and rotation
    var cX = this.position.x + (0.6 * this.width) *
        Math.cos(this.rotation - (Math.PI/2));
    var cY = this.position.y + (0.6 * this.width) *
        Math.sin(this.rotation - (Math.PI/2));
    this._compass.position.copyFrom(new Phaser.Point(cX, cY));
    this._compass.rotation = this.rotation;

    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
};

Player.prototype._onCollideWithEnemy = function (self, enemy) {
    if (!this._invulnerable && enemy._spawned && !this._isTakingDamage) {
        this.takeDamage();
        this.game.camera.shake(0.01, 200);
        this._hitSoud.play();
        // Trigger a red flash to indicate damage!
        this._effects.lightFlash(0XF2CECE);
    }
};

Player.prototype._onCollideWithPickup = function (self, pickup) {
    if (pickup instanceof LightPickup) {
        this.game.globals.scoreKeeper.incrementScore(1);
        this._ammoManager.incrementAmmoByColor(pickup.color, 1);
    }
    this.pickupSound.play();
    pickup.pickUp();
};

Player.prototype.takeDamage = function () {
    // If player is already taking damage, nothing else to do
    if (this._isTakingDamage) return;

    // Lose a heart & restart the game if no hearts remain
    this.hearts -= 1;
    if (this.hearts <= 0) {
        this.game.camera.reset(); // Kill camera shake to prevent restarting with partial shake
        this.game.state.restart();
    }

    // Speed boost on damage
    var originalSpeed = this._maxSpeed;
    this._maxSpeed = 2 * this._maxSpeed;

    // Flicker tween to indicate when player is invulnerable
    this._isTakingDamage = true;
    var tween = this.game.make.tween(this)
        .to({ alpha: 0.25 }, 100, "Quad.easeInOut", true, 0, 5, true);

    // When tween is over, reset
    tween.onComplete.add(function() {
        this._isTakingDamage = false;
        this._maxSpeed = originalSpeed;
    }, this);
};

Player.prototype.destroy = function () {
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    for (var key in this._weapons) {
        this._weapons[key].destroy();
    }
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};