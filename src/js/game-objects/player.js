module.exports = Player;

var Controller = require("../helpers/controller.js");
var Gun = require("./weapons/gun.js");
var Laser = require("./weapons/laser.js");
var Sword = require("./weapons/sword.js");
var ComboTracker = require("../helpers/combo-tracker.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move",
    ATTACK: "attack",
    HIT: "hit",
    DIE: "die"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup, enemies, pickups, reticule, 
    comboTracker) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._isShooting = false;
    this._isDead = false;
    this._reticule = reticule;
    this._enemies = enemies;
    this._pickups = pickups;

    this._comboTracker = comboTracker;
    this._comboTracker.addListener(this._onComboUpdate, this);

    // Combo
    this._comboTracker = new ComboTracker(game, 2000);
    // Weapons
    this._gunType = "gun";
    this._allGuns = {
        "gun": new Gun(game, parentGroup, this, 150, 450),
        "laser": new Laser(game, parentGroup, this, 200, 500),
        "sword": new Sword(game, parentGroup, this, 200, 450)
    };

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("player/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("player/move-", 1, 4, 
        "", 2);
    var attackFrames = Phaser.Animation.generateFrameNames("player/attack-", 2,
        4, "", 2);
    var hitFrames = Phaser.Animation.generateFrameNames("player/hit-", 1, 4, 
        "", 2);
    var dieFrames = Phaser.Animation.generateFrameNames("player/die-", 1, 4, 
        "", 2);
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
    this.body.setCircle(this.width / 2 * 0.5); // Fudge factor

    // Player controls
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    // movement
    this._controls.addKeyboardControl("move-up", [Kb.W]);
    this._controls.addKeyboardControl("move-left", [Kb.A]);
    this._controls.addKeyboardControl("move-right", [Kb.D]);
    this._controls.addKeyboardControl("move-down", [Kb.S]);
    // primary attack
    this._controls.addKeyboardControl("attack-up", [Kb.UP]);
    this._controls.addKeyboardControl("attack-left", [Kb.LEFT]);
    this._controls.addKeyboardControl("attack-right", [Kb.RIGHT]);
    this._controls.addKeyboardControl("attack-down", [Kb.DOWN]);
    this._controls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);
    // special attack
    this._controls.addKeyboardControl("attack-special", [Kb.SPACEBAR]);
    this._controls.addMouseDownControl("attack-special",
        Phaser.Pointer.RIGHT_BUTTON);
}

Player.prototype.getCombo = function () {
    return this._comboTracker.getCombo();
};

Player.prototype.incrementCombo = function (increment) {
    this._comboTracker.incrementCombo(increment);
    var newSpeed = Phaser.Math.mapLinear(this.getCombo(), 0, 50, 50, 500);
    newSpeed = Phaser.Math.clamp(newSpeed, 50, 500);
    this._maxSpeed = newSpeed; 
};

Player.prototype.update = function () {
    this._controls.update();

    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    if (this._controls.isControlActive("move-left")) acceleration.x = -1;
    else if (this._controls.isControlActive("move-right")) acceleration.x = 1;
    if (this._controls.isControlActive("move-up")) acceleration.y = -1;
    else if (this._controls.isControlActive("move-down")) acceleration.y = 1;

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
    /* jshint ignore:start */
    // Based on: https://github.com/photonstorm/phaser/blob/v2.4.8/src/physics/arcade/World.js#L257
    /* jshint ignore:end */
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

    // Firing logic
    var isShooting = false;
    var attackDir = this.position.clone();
    if (this._controls.isControlActive("attack")) {
        isShooting = true;
        attackDir = this._reticule.position.clone();
    }
    if (this._controls.isControlActive("attack-left")) {
        isShooting = true;
        attackDir.x += -1;
    } else if (this._controls.isControlActive("attack-right")) {
        isShooting = true;
        attackDir.x += 1;
    }
    if (this._controls.isControlActive("attack-up")) {
        isShooting = true;
        attackDir.y += -1;
    } else if (this._controls.isControlActive("attack-down")) {
        isShooting = true;
        attackDir.y += 1;
    }
    if (isShooting) {
        this._allGuns[this._gunType].fire(attackDir);
        if (this._gunType === "sword") {
            this._allGuns[this._gunType]._isDrawn = true;
        }
    } else {
        if (this._gunType === "sword") {
            this._allGuns[this._gunType]._isDrawn = false;
        }
    }
    // special weapons logic
    var isShootingSpecial = false;
    if (this._controls.isControlActive("attack-special")) {
        isShootingSpecial = true;
        this._allGuns[this._gunType].specialFire();
    }

    // Check whether player is moving in order to update its animation
    var isIdle = acceleration.isZero();
    if ((isShooting || isShootingSpecial) &&
        (this.animations.name !== ANIM_NAMES.ATTACK)) {
        this.animations.play(ANIM_NAMES.ATTACK);
    } else if (!isShooting && !isShootingSpecial && isIdle &&
        this.animations.name !== ANIM_NAMES.IDLE) {
        this.animations.play(ANIM_NAMES.IDLE);
    } else if (!isShooting && !isShootingSpecial && !isIdle &&
        this.animations.name !== ANIM_NAMES.MOVE) {
        this.animations.play(ANIM_NAMES.MOVE);
    }

    // Enemy collisions
    this._checkOverlapWithGroup(this._enemies, this._onCollideWithEnemy, this);

    // Pickup collisions
    this._checkOverlapWithGroup(this._pickups, this._onCollideWithPickup, this);

    // if (this._isDead) {
    //     console.log("dead!");
    //     this.animations.play(ANIM_NAMES.DIE);
    //     this.animations.onComplete.add(function() {
    //         this._isDead = false;
    //         this.destroy();
    //         this.game.state.restart();
    //     }, this);
    // }
};

Player.prototype._onCollideWithEnemy = function () {
    // return to start screen
    // *** this doesn't work, didn't look into it...
    // this.game.state.start("start");

    // for sandbox testing
    // console.log("died!");
    // this.body.enable = false;
    // this._isDead = true;

    this.game.state.restart();
};

Player.prototype._onCollideWithPickup = function (self, pickup) {
    if (pickup._category === "weapon") {
        if (pickup.type === "sword") {
            console.log("sword!");
        } else {
            this._gunType = pickup.type;   
        }
    }
    pickup.destroy();
};

Player.prototype._onComboUpdate = function (combo) {
    var newSpeed = Phaser.Math.mapLinear(combo, 0, 50, 50, 500);
    newSpeed = Phaser.Math.clamp(newSpeed, 50, 500);
    this._maxSpeed = newSpeed; 
};

Player.prototype._checkOverlapWithGroup = function (group, callback, 
    callbackContext) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            this._checkOverlapWithGroup(child, callback, callbackContext);
        } else {
            this.game.physics.arcade.overlap(this, child, callback, null, 
                callbackContext);
        }
    }
};

Player.prototype.destroy = function () {
    this._comboTracker.destroy();
    Phaser.Sprite.prototype.destroy.call(this, arguments);
};