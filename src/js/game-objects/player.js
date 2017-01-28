module.exports = Player;

var Controller = require("../helpers/controller.js");
var spriteUtils = require("../helpers/sprite-utilities.js");
var ComboTracker = require("../helpers/combo-tracker.js");
var Reticule = require("./reticule.js");
var Gun = require("./weapons/gun.js");
var MachineGun = require("./weapons/machine-gun.js");
var Laser = require("./weapons/laser.js");
var Arrow = require("./weapons/arrow.js");
var Beam = require("./weapons/beam.js");
var Scattershot = require("./weapons/scattershot.js");
var Flamethrower = require("./weapons/flamethrower.js");
var Grenade = require("./weapons/grenade.js");
var Rocket = require("./weapons/rocket.js");
// Test
var RustySword = require("./weapons/rusty-sword.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move",
    ATTACK: "attack",
    HIT: "hit",
    DIE: "die"
};

var WEAPONS = require("../constants/weapons.js");

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

    this._isShooting = false;
    this._isDead = false;
    
    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._lights = globals.groups.lights;

    // Control options
    this._controlType = globals.options.controlTypes[globals.options.controls];
    this._controlCtr = 0;
    // Timer for flipping cooldown
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._ableToFlip = true;

    // Combo
    this._comboTracker = new ComboTracker(game, 2000);

    // Reticle
    this._reticule = new Reticule(game, globals.groups.foreground);

    // Weapons
    this._weapons = {};
    this._weapon = 
        this._weapons[WEAPONS.SLUG] = new Gun(game, parentGroup, this);
    this._canShoot = true;

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
    this.flashlight = this._lighting.addLight(new Phaser.Circle(0, 0, 50), 
        Phaser.Color.getColor32(150, 210, 210, 255));
    globals.groups.foreground.add(this.flashlight);

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
    // pickup
    this._controls.addKeyboardControl("toggle-pickup", [Kb.SHIFT]);
    // movement
    this._controls.addKeyboardControl("move-up", [Kb.W]);
    this._controls.addKeyboardControl("move-left", [Kb.A]);
    this._controls.addKeyboardControl("move-right", [Kb.D]);
    this._controls.addKeyboardControl("move-down", [Kb.S]);
    // primary attack
    this._controls.addKeyboardControl("arrow-up", [Kb.UP]);
    this._controls.addKeyboardControl("arrow-left", [Kb.LEFT]);
    this._controls.addKeyboardControl("arrow-right", [Kb.RIGHT]);
    this._controls.addKeyboardControl("arrow-down", [Kb.DOWN]);
    this._controls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);
    // special attack
    this._controls.addKeyboardControl("attack-space", [Kb.SPACEBAR]);
    this._controls.addMouseDownControl("attack-special",
        Phaser.Pointer.RIGHT_BUTTON);
    // Cycling weapons
    this._controls.addKeyboardControl(WEAPONS.RUSTY_SWORD, [Kb.ONE]);
    this._controls.addKeyboardControl(WEAPONS.SCATTERSHOT, [Kb.TWO]);
    this._controls.addKeyboardControl(WEAPONS.FLAMETHROWER, [Kb.THREE]);
    this._controls.addKeyboardControl(WEAPONS.MACHINE_GUN, [Kb.FOUR]);
    this._controls.addKeyboardControl(WEAPONS.LASER, [Kb.FIVE]);
    this._controls.addKeyboardControl(WEAPONS.BEAM, [Kb.SIX]);
    this._controls.addKeyboardControl(WEAPONS.ARROW, [Kb.SEVEN]);
    this._controls.addKeyboardControl(WEAPONS.GRENADE, [Kb.EIGHT]);
    this._controls.addKeyboardControl(WEAPONS.ROCKET, [Kb.NINE]);
    this._controls.addKeyboardControl(WEAPONS.SLUG, [Kb.ZERO]);
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
    
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Calculate the player's new acceleration. It should be zero if no keys are
    // pressed - allows for quick stopping.
    var acceleration = new Phaser.Point(0, 0);

    // The agar.io controls override normal WASD controls
    if (this._controlType !== "agar.io") {
        if (this._controls.isControlActive("move-left")) {
            acceleration.x = -1;
        } else if (this._controls.isControlActive("move-right")) {
            acceleration.x = 1;
        }
        if (this._controls.isControlActive("move-up")) {
            acceleration.y = -1;
        } else if (this._controls.isControlActive("move-down")) {
            acceleration.y = 1;
        }
    } else {
        // When the mouse is down, move the player to the mouse position
        if (this._controls.isControlActive("attack")) {
            // Calculate the acceleration based on the direction
            // the player needs to travel to reach the reticle
            var distance = this.position.distance(this._reticule.position);
            var angle = this.position.angle(this._reticule.position);
            var targetSpeed = distance / this.game.time.physicsElapsed;
            var magnitude = Math.min(this._maxSpeed, targetSpeed);
            acceleration.x = magnitude * Math.cos(angle);
            acceleration.y = magnitude * Math.sin(angle);
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
    // Only shoot if not carrying an item
    this._canShoot = !this._lightBeingCarried;

    // The control type option will determine how the player rotates
    // Update the current control type, and then update rotation!
    // TODO(rex): Select a control type and change it to 'keyboard'!
    var options = this.game.globals.options;
    this._controlType = options.controlTypes[options.controls];
    if (this._controlType === "mouse") {
        // Update the rotation of the player based on the reticule
        this.rotation = this.position.angle(this._reticule.position) +
            (Math.PI/2);
    } else if (this._controlType === "agar.io") { 
        // Update the rotation of the player based on the reticule
        this.rotation = this.position.angle(this._reticule.position) +
            (Math.PI/2);
    } else if (this._controlType === "asteroids") {
        // NOTE(rex): The following is a bizarre attempt to give some
        // acceleration to the rotation of the player.  I just hacked
        // this together in the moment, and there is most likely a
        // better way to do this.  Figure it out...

        // If one of the arrow keys is active, update the rotation
        if (this._controls.isControlActive("arrow-left")) {
            // Increment the counter
            this._controlCtr++;
            // Increase rotation to a point,
            var modL = 60 - (this._controlCtr * this._controlCtr * 0.12);
            if (modL > 18) {
                this.rotation -= Math.PI/modL;
            } else {
                // then cap it
                this.rotation -= Math.PI/18;
            }
        } else if (this._controls.isControlActive("arrow-right")) {
            // Increment the counter
            this._controlCtr++;
            // Increase rotation to a point,
            var modR = 60 - (this._controlCtr * this._controlCtr * 0.12);
            if (modR > 18) {
                this.rotation += Math.PI/modR;
            } else {
                // then cap it
                this.rotation += Math.PI/18;
            }
        } else if (this._controls.isControlActive("arrow-down")) {
            // The down arrow is used to flip the player 180 degrees,
            // it has a cooldown so you don't flip constantly if
            // holding the down arrow.
            if (this._ableToFlip) {
                this.rotation += Math.PI;
                this._startCooldown(540);
            }
        } else {
            // Reset the counter if no rotation arrows are active
            this._controlCtr = 0;
        }
    } else if (this._controlType === "zelda") {
        // If one of the arrow keys is active, update the rotation
        // Do cardinal directions first
        if (this._controls.isControlActive("arrow-left")) {
            this.rotation = 270*(Math.PI/180);
        } else if (this._controls.isControlActive("arrow-right")) {
            this.rotation = 90*(Math.PI/180);
        }
        if (this._controls.isControlActive("arrow-up")) {
            this.rotation = 0*(Math.PI/180);
        } else if (this._controls.isControlActive("arrow-down")) {
            this.rotation = 180*(Math.PI/180);
        }
        // Then diagonals!
        if (this._controls.isControlActive("arrow-left") &&
            this._controls.isControlActive("arrow-up")) {
            this.rotation = 315*(Math.PI/180);
        } else if (this._controls.isControlActive("arrow-right") &&
                   this._controls.isControlActive("arrow-up")) {
            this.rotation = 45*(Math.PI/180);
        }
        if (this._controls.isControlActive("arrow-left") &&
            this._controls.isControlActive("arrow-down")) {
            this.rotation = 235*(Math.PI/180);
        } else if (this._controls.isControlActive("arrow-right") &&
                   this._controls.isControlActive("arrow-down")) {
            this.rotation = 135*(Math.PI/180);
        }
    }

    // ammo check
    if (this._weapon.isAmmoEmpty && this._weapon.isAmmoEmpty()) {
        this.changeGuns(WEAPONS.SLUG);
    }

    // Swapping weapons
    for (var key in WEAPONS) {
        var weaponName = WEAPONS[key];
        if (this._controls.isControlActive(weaponName)) {
            this.changeGuns(weaponName);
        }
    }

    // Firing logic
    var isShooting = false;
    var attackDir = this.position.clone();

    // Control options will also impact the firing logic
    if (this._controlType === "mouse") {
        // If the control type is mouse...
        // Attack direction is cloned from the mouse position
        if (this._controls.isControlActive("attack")) {
            isShooting = true;
            attackDir = this._reticule.position.clone();
        }
    } else if (this._controlType === "agar.io") {
        // If the control type is agar.io...
        // Space fires in the direction the player is currently facing
        if (this._controls.isControlActive("attack-space")) {
            isShooting = true;
            // Calculate an arbitrary target position in the
            // direction the player is facing
            attackDir.x = this.position.x + (0.75 * this.width) * 
                Math.cos(this.rotation - (Math.PI/2));
            attackDir.y = this.position.y + (0.75 * this.width) * 
                Math.sin(this.rotation - (Math.PI/2));
        }
    } else if (this._controlType === "asteroids") {
        // If the control type is asteroids...
        // The up arrow fires in the direction the player is currently facing
        if (this._controls.isControlActive("arrow-up")) {
            isShooting = true;
            // Calculate an arbitrary target position in the
            // direction the player is facing
            attackDir.x = this.position.x + (0.75 * this.width) * 
                Math.cos(this.rotation - (Math.PI/2));
            attackDir.y = this.position.y + (0.75 * this.width) * 
                Math.sin(this.rotation - (Math.PI/2));
        }
    } else if (this._controlType === "zelda") {
        // If the control type is zelda...
        // Check the arrow keys for a direction
        // Do cardinal directions first!
        if (this._controls.isControlActive("arrow-left")) {
            isShooting = true;
            attackDir.x += -1;
        } else if (this._controls.isControlActive("arrow-right")) {
            isShooting = true;
            attackDir.x += 1;
        } else  if (this._controls.isControlActive("arrow-up")) {
            isShooting = true;
            attackDir.y += -1;
        } else if (this._controls.isControlActive("arrow-down")) {
            isShooting = true;
            attackDir.y += 1;
        }
        // Then do diagonals
        if (this._controls.isControlActive("arrow-left") &&
            this._controls.isControlActive("arrow-up")) {
            isShooting = true;
            attackDir.x += -1;
            attackDir.y += -1;
        } else if (this._controls.isControlActive("arrow-right") &&
                   this._controls.isControlActive("arrow-up")) {
            isShooting = true;
            attackDir.x += 1;
            attackDir.y += -1;
        }
        if (this._controls.isControlActive("arrow-left") &&
            this._controls.isControlActive("arrow-down")) {
            isShooting = true;
            attackDir.x += -1;
            attackDir.y += 1;
        } else if (this._controls.isControlActive("arrow-right") &&
                   this._controls.isControlActive("arrow-down")) {
            isShooting = true;
            attackDir.x += 1;
            attackDir.y += 1;
        }
    }
    if (isShooting && this._canShoot) {
        this._weapon.fire(attackDir);
    }

    // special weapons logic
    var isShootingSpecial = false;
    var specialAttackDir = this.position.clone();
    if (this._controls.isControlActive("attack-special")) {
        isShootingSpecial = true;
        specialAttackDir = this._reticule.position.clone();
    }
    // Space does something different in the agar.io controls
    if (this._controls.isControlActive("attack-space") &&
        this._controlType !== "agar.io") {
        isShootingSpecial = true;
        specialAttackDir.x += 0;
        specialAttackDir.y -= 1;
    }
    if (isShootingSpecial && this._weapon.specialFire && this._canShoot) {
        this._weapon.specialFire(specialAttackDir);
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
    spriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);

    // Pickup collisions
    spriteUtils.checkOverlapWithGroup(this, this._pickups, 
        this._onCollideWithPickup, this);
};

Player.prototype.postUpdate = function () {
    // This is not a pretty hack, but it checks whether the player is in shadow
    // in either of the cardinal directions. If yes, turn on the player's 
    // flashlight. MH: this weirdness was necessary because as soon the player's
    // light is turned on, the player's immediate position is no longer in 
    // shadow.
    var pos = this.position;
    var P = Phaser.Point;
    var d = this.flashlight.radius + 5;
    if (this._lighting.isPointInShadow(P.add(pos, new P(0, d))) ||
            this._lighting.isPointInShadow(P.add(pos, new P(0, -d))) ||
            this._lighting.isPointInShadow(P.add(pos, new P(d, 0))) ||
            this._lighting.isPointInShadow(P.add(pos, new P(-d, 0)))) {
        this.flashlight.enabled = true;
        this.flashlight.position.copyFrom(pos);
    } else {
        this.flashlight.enabled = false;
    }

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
    }
    pickup.destroy();
};

Player.prototype.destroy = function () {
    this._reticule.destroy();
    this._comboTracker.destroy();
    this._timer.destroy();
    this._cooldownTimer.destroy();
    this.game.tweens.removeFrom(this);
    for (var key in this._weapons) {
        this._weapons[key].destroy();
    }
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Player.prototype.getGun = function() {
    return this._weapon;
};

Player.prototype.getAmmo = function() {
    if (this._weapon.getAmmo) return this._weapon.getAmmo();
};

Player.prototype.changeGuns = function (weaponName) {
    // If a gun of the appropriate type has been created, refill the ammo.
    // Otherwise, create a new gun.
    if (this._weapons[weaponName]) {
        this._weapon = this._weapons[weaponName];
        if (this._weapon.fillAmmo) this._weapon.fillAmmo();
    } else {
        var weapon;
        if (weaponName === WEAPONS.MACHINE_GUN) {
            weapon = new MachineGun(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.LASER) {
            weapon = new Laser(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.BEAM) {
            weapon = new Beam(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.ARROW) {
            weapon = new Arrow(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.SCATTERSHOT) {
            weapon = new Scattershot(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.FLAMETHROWER) {
            weapon = new Flamethrower(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.GRENADE) {
            weapon = new Grenade(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.ROCKET) {
            weapon = new Rocket(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.SLUG) {
            weapon = new Gun(this.game, this.parent, this);
        } else if (weaponName === WEAPONS.RUSTY_SWORD) {
            weapon = new RustySword(this.game, this.parent, this);
        }
        this._weapon = this._weapons[weaponName] = weapon;
    }
}

Player.prototype._startCooldown = function (time) {
    if (!this._ableToFlip) return;
    this._ableToFlip = false;
    this._cooldownTimer.add(time, function () {
        this._ableToFlip = true;
    }, this);
};
