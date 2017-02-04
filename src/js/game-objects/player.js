module.exports = Player;

var Controller = require("../helpers/controller.js");
var spriteUtils = require("../helpers/sprite-utilities.js");
var Reticule = require("./reticule.js");
var lightUtils = require("./lights/light-utilities.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move",
    ATTACK: "attack",
    HIT: "hit",
    DIE: "die"
};

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);

function Player(game, x, y, parentGroup) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.hearts = 3;
    this.coins = 120;
    this._isTakingDamage = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._isDead = false;
    
    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._lights = globals.groups.lights;

    // Timer for flipping cooldown
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._ableToFlip = true;

    // Reticle
    this._reticule = new Reticule(game, globals.groups.foreground);

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
    var diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);

    this.satBody = globals.plugins.satBody.addCircleBody(this);

    // Lighting for player
    this._lighting = globals.plugins.lighting;
    this.flashlight = this._lighting.addLight(new Phaser.Point(0, 0), 
        lightUtils.generateSpotlightPolygon(0, 60, 200), 
        Phaser.Color.getColor32(150, 210, 210, 255));
    globals.groups.foreground.add(this.flashlight);
    this.flashlight.enabled = true;

    // Directional arrow, for dev purposes
    this._compass = game.make.image(0, 0, "assets", "hud/targeting-arrow");
    this._compass.scale.setTo(0.64, 0.64);
    // Set the anchor, position and rotation.
    this._compass.anchor.copyFrom(this.anchor);
    var cX = this.position.x + (0.6 * this.width) *
        Math.cos(this.rotation - (Math.PI/2));
    var cY = this.position.y + (0.6 * this.width) *
        Math.sin(this.rotation - (Math.PI/2));
    this._compass.position.copyFrom(new Phaser.Point(cX, cY));
    this._compass.rotation = this.rotation;
    // Add it to the foreground (so it is visible).
    game.globals.groups.midground.add(this._compass);

    // Player controls
    this._controls = new Controller(this.game.input);
    var Kb = Phaser.Keyboard;
    var P = Phaser.Pointer;
    // pickup
    this._controls.addKeyboardControl("toggle-pickup", [Kb.SHIFT]);
    // movement
    this._controls.addKeyboardControl("move-up", [Kb.W]);
    this._controls.addKeyboardControl("move-left", [Kb.A]);
    this._controls.addKeyboardControl("move-right", [Kb.D]);
    this._controls.addKeyboardControl("move-down", [Kb.S]);
    this._controls.addMouseDownControl("mouse-move", [P.LEFT_BUTTON]);
}

Player.prototype.update = function () {
    this._controls.update();
    
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    // WASD controls
    var keyboardMovement = false;
    if (this._controls.isControlActive("move-left")) acceleration.x = -1;
    else if (this._controls.isControlActive("move-right")) acceleration.x = 1;
    if (this._controls.isControlActive("move-up")) acceleration.y = -1;
    else if (this._controls.isControlActive("move-down")) acceleration.y = 1;
    // If keyboard was active, update rotation
    if (acceleration.getMagnitude() > 0) {
        keyboardMovement = true;
        this.rotation = new Phaser.Point(0, 0).angle(acceleration) +
            (Math.PI/2);
    }

    // Agar.io mouse controls (if keyboard controls aren't active this frame)
    if (!keyboardMovement) {
        this.rotation = this.position.angle(this._reticule.position) +
            (Math.PI/2);
        if (this._controls.isControlActive("mouse-move")) {
            var d = Phaser.Point.subtract(this._reticule.position, 
                this.position);
            // If distance is more than a few pixels, set the acceleration to
            // move in the direction of the distance
            if (d.getMagnitude() > 5) acceleration.copyFrom(d);
            if (acceleration.getMagnitude() < 5) acceleration.set(0, 0);
        }
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

    // Pickup light logic
    var pickupControl = this._controls.isControlActive("toggle-pickup");
    // Only attempt to toggle pickup the frame the key was pressed
    if (pickupControl && !this._lastPickupToggle) {
        // Delay to prevent multiple pickups from running
        this._canPickup = false;
        this._timer.add(100, function () { 
            this._canPickup = true; 
        }, this);
        if (this._lightBeingCarried) {
            // If carrying a pickup, drop it
            this._lightBeingCarried.drop();
            this._lightBeingCarried = null;
        } else {
            // If overlapping a pickup and it has a pickUp method, pick it up
            var arcade = this.game.physics.arcade;
            this._lights.forEach(function (light) {
                if (light.body && light.pickUp && 
                        arcade.intersects(light.body, this.body)) {
                    light.pickUp(this);
                    this._lightBeingCarried = light;
                }
            }, this);
        }
    }
    this._lastPickupToggle = pickupControl;

    // Enemy collisions
    spriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);

    // Pickup collisions
    spriteUtils.checkOverlapWithGroup(this, this._pickups, 
        this._onCollideWithPickup, this);
};

Player.prototype.postUpdate = function () {
    // Update flashlight placement
    this.flashlight.rotation = this.rotation - (Math.PI / 2);
    this.flashlight.position.copyFrom(this.position);
    // Check if the position just behind the player is in shadow. Since the
    // flashlight points forward from the player, the flashlight's light get in
    // way for this calculation.
    var pos = this.position.clone().subtract(
        Math.cos(this.rotation - (Math.PI / 2)) * 5,
        Math.sin(this.rotation - (Math.PI / 2)) * 5
    );
    // this.flashlight.enabled = this._lighting.isPointInShadow(pos);

    // Update compass position and rotation
    var cX = this.position.x + (0.6 * this.width) *
        Math.cos(this.rotation - (Math.PI/2));
    var cY = this.position.y + (0.6 * this.width) *
        Math.sin(this.rotation - (Math.PI/2));
    this._compass.position.copyFrom(new Phaser.Point(cX, cY));
    this._compass.rotation = this.rotation;

    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
};

Player.prototype._onCollideWithEnemy = function () {
    this.takeDamage();
};

Player.prototype.takeDamage = function () {
    // If player is already taking damage, nothing else to do
    if (this._isTakingDamage) return;

    // Lose a heart & restart the game if no hearts remain
    this.hearts -= 1;
    if (this.hearts <= 0) {
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

Player.prototype._onCollideWithPickup = function (self, pickup) {
    if (pickup._category === "weapon") {
        self.changeGuns(pickup.type);
    } else if (pickup._category === "score") {
        this.coins += pickup._pointValue;
    }
    pickup.destroy();
};

Player.prototype.destroy = function () {
    this._reticule.destroy();
    this._timer.destroy();
    this._cooldownTimer.destroy();
    this.game.tweens.removeFrom(this);
    for (var key in this._weapons) {
        this._weapons[key].destroy();
    }
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Player.prototype._startCooldown = function (time) {
    if (!this._ableToFlip) return;
    this._ableToFlip = false;
    this._cooldownTimer.add(time, function () {
        this._ableToFlip = true;
    }, this);
};
