module.exports = Player;

var Controller = require("../helpers/controller.js");
var spriteUtils = require("../helpers/sprite-utilities.js");
var Reticule = require("./reticule.js");
var colors = require("../constants/colors.js");
var Color = require("../helpers/Color.js");
var lightUtils = require("./lights/light-utilities.js");
var CooldownAbility = require("./components/cooldown-ability.js");

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
    this._isTakingDamage = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._isDead = false;

    this.damage = 10000; // NOTE(rex): Not quite sure if this should be a part of the player or not...
    
    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._lights = globals.groups.lights;
    this._effects = this.game.globals.plugins.effects;

    // Timer for flipping cooldown
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();

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
    var lightSize = 600;
    this.flashlight = this._lighting.addLight(new Phaser.Point(0, 0), 
        new Phaser.Circle(0, 0, lightSize), 
        colors.white, colors.red);
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
    this._controls.addMouseDownControl("pulse", [P.LEFT_BUTTON]);
    this._controls.addMouseDownControl("dash", [P.RIGHT_BUTTON]);

    // Player abilities
    this._pulseAbility = new CooldownAbility(this.game, 1600, 200);
    this._dashAbility = new CooldownAbility(this.game, 3500, 300);
}

Player.prototype.update = function () {
    // Update keyboard/mouse inputs
    this._controls.update();

    // Calculate the destination and heading from the mouse
    var g = this.game;
    var destination = new Phaser.Point(
        g.input.mousePointer.x + g.camera.x - this.body.width / 2,
        g.input.mousePointer.y + g.camera.y - this.body.height / 2
    );
    var heading = this.body.position.angle(destination);

    // Speed limit
    var maxDistance = 110 * this.game.time.physicsElapsed; // 110 px/s

    // Fire the flashlight pulse!
    if (this._controls.isControlActive("pulse") && this._pulseAbility.isReady()) {
        this._effects.lightFlash(this.flashlight.pulseColor.getRgbColorInt());
        this._pulseAbility.activate();
        this.flashlight.startPulse();
    }

    // Dash ability
    if (this._controls.isControlActive("dash") && this._dashAbility.isReady()) {
        this._dashAbility.activate();
        this._dashHeading = heading;
        this._invulnerable = true;
        this.alpha = 0.5;
        this._dashAbility.onDeactivation.addOnce(function () {
            this._invulnerable = false;
            this.alpha = 1;
        }, this);
    }
    if (this._dashAbility.isActive()) {
        maxDistance *= 5;
        destination = this.body.position.clone();
        destination.add(
            1000 * Math.cos(this._dashHeading),
            1000 * Math.sin(this._dashHeading)
        );
    }

    // Move towards the mouse position
    var delta = Phaser.Point.subtract(destination, this.body.position);
    var targetDistance = delta.getMagnitude();
    if (targetDistance > maxDistance) {
        delta.setMagnitude(maxDistance);
    }
    this.body.position.add(delta.x, delta.y);
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Update the rotation of the player based on the reticule
    this.rotation = this.position.angle(this._reticule.position) +
        (Math.PI/2);

    // Enemy collisions
    spriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);

    // Light pickups
    spriteUtils.checkOverlapWithGroup(this, this._pickups, 
        this._onCollideWithPickup, this);

    // Damage enemies
    var damage = this.damage * this.game.time.physicsElapsed;
    spriteUtils.forEachRecursive(this._enemies, function (child) {
        if (child instanceof Phaser.Sprite && child.takeDamage) {
            // MH: why does world position not work here...
            var inLight = this.flashlight.isPointInPulse(child.position);
            var flashlightColor = this.flashlight.pulseColor;
            var enemyColor = child.color;
            // If the enemy color matches the flashlight color, then the enemies
            // should take damage.
            var matchingLights = flashlightColor.rgbEquals(enemyColor);
            if (inLight && matchingLights) {
                child.takeDamage(damage);
            }
        }
    }, this);

};

Player.prototype.postUpdate = function () {
    // Update flashlight placement
    this.flashlight.rotation = this.rotation - (Math.PI / 2);
    this.flashlight.position.copyFrom(this.position);

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
    }
};

Player.prototype._onCollideWithPickup = function (self, pickup) {
    this.game.globals.scoreKeeper.incrementScore(1);
    this.flashlight.pulseColor = pickup.color;
    pickup.pickUp();
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