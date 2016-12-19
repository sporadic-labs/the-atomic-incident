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
var Explosive = require("./weapons/explosive.js");

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

    this._isShooting = false;
    this._isDead = false;
    
    // Shorthand
    var globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._lights = globals.groups.lights;

    // Combo
    this._comboTracker = new ComboTracker(game, 2000);

    // Reticle
    this._reticule = new Reticule(game, globals.groups.foreground);

    // Weapons
    this._gun = new Gun(game, parentGroup, this);

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

    this.satBody = globals.plugins.satBody.addBoxBody(this);

    // Lighting for player
    this._lighting = globals.plugins.lighting;
    this.playerLight = this._lighting.addLight(
        new Phaser.Point(this.position.x, this.position.y), 36, 0xEBDC6A
    );
    globals.groups.foreground.add(this.playerLight);

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
    this._controls.addKeyboardControl("attack-space", [Kb.SPACEBAR]);
    this._controls.addMouseDownControl("attack-special",
        Phaser.Pointer.RIGHT_BUTTON);
    // Cycling weapons
    this._controls.addKeyboardControl("rusty-sword", [Kb.ONE]);
    this._controls.addKeyboardControl("weapon-scattershot", [Kb.TWO]);
    this._controls.addKeyboardControl("weapon-flamethrower", [Kb.THREE]);
    this._controls.addKeyboardControl("weapon-machine-gun", [Kb.FOUR]);
    this._controls.addKeyboardControl("weapon-laser", [Kb.FIVE]);
    this._controls.addKeyboardControl("weapon-beam", [Kb.SIX]);
    this._controls.addKeyboardControl("weapon-arrow", [Kb.SEVEN]);
    this._controls.addKeyboardControl("grenade", [Kb.EIGHT]);
    this._controls.addKeyboardControl("rocket", [Kb.NINE]);
    this._controls.addKeyboardControl("weapon-slug", [Kb.ZERO]);

    this._controls.addKeyboardControl("explosive", [Kb.M]);
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

    // Update light position
    this.playerLight.position = this.position;

    // ammo check
    if (this._gun.isAmmoEmpty && this._gun.isAmmoEmpty()) {
        this._gun.destroy();
        this._gun = new Gun(this.game, this.parent, this);
    }

    // Swapping weapons
    if (this._controls.isControlActive("weapon-machine-gun")) {
        this.changeGuns("weapon-machine-gun");
    } else if (this._controls.isControlActive("weapon-laser")) {
        this.changeGuns("weapon-laser");
    } else if (this._controls.isControlActive("weapon-beam")) {
        this.changeGuns("weapon-beam");
    } else if (this._controls.isControlActive("weapon-arrow")) {
        this.changeGuns("weapon-arrow");
    } else if (this._controls.isControlActive("weapon-scattershot")) {
        this.changeGuns("weapon-scattershot");
    } else if (this._controls.isControlActive("weapon-flamethrower")) {
        this.changeGuns("weapon-flamethrower");
    } else if (this._controls.isControlActive("grenade")) {
        this.changeGuns("grenade");
    } else if (this._controls.isControlActive("rocket")) {
        this.changeGuns("rocket");
    } else if (this._controls.isControlActive("weapon-slug")) {
        this.changeGuns("weapon-slug");
    } else if (this._controls.isControlActive("rusty-sword")) {
        this.changeGuns("rusty-sword");

    } else if (this._controls.isControlActive("explosive")) {
        this.changeGuns("explosive");
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
        this._gun.fire(attackDir);
    }

    // special weapons logic
    var isShootingSpecial = false;
    var specialAttackDir = this.position.clone();
    if (this._controls.isControlActive("attack-special")) {
        isShootingSpecial = true;
        specialAttackDir = this._reticule.position.clone();
    }
    if (this._controls.isControlActive("attack-space")) {
        isShootingSpecial = true;
        specialAttackDir.x += 0;
        specialAttackDir.y -= 1;
    }
    if (isShootingSpecial && this.getGun().specialFire) {
        this._gun.specialFire(specialAttackDir);
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

    // Light collisions
    this.game.physics.arcade.collide(this, this._lights);
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
        self._gunType = pickup.type;
        self.changeGuns(pickup.type);
    }
    pickup.destroy();
};

Player.prototype.destroy = function () {
    this._reticule.destroy();
    this._comboTracker.destroy();
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    for (var gun in this._allGuns) {
        this._allGuns[gun].destroy();
    }
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Player.prototype.getGun = function() {
    return this._gun;
};

Player.prototype.getAmmo = function() {
    if (this._gun.getAmmo) return this._gun.getAmmo();
};

Player.prototype.changeGuns = function(type) {
    if (type === "weapon-machine-gun") {
        this._gun.destroy();
        this._gun = new MachineGun(this.game, this.parent, this);
    } else if (type === "weapon-laser") {
        this._gun.destroy();
        this._gun = new Laser(this.game, this.parent, this);
    } else if (type === "weapon-beam") {
        this._gun.destroy();
        this._gun = new Beam(this.game, this.parent, this);
    } else if (type === "weapon-arrow") {
        this._gun.destroy();
        this._gun = new Arrow(this.game, this.parent, this);
    } else if (type === "weapon-scattershot") {
        this._gun.destroy();
        this._gun = new Scattershot(this.game, this.parent, this);
    } else if (type === "weapon-flamethrower") {
        this._gun.destroy();
        this._gun = new Flamethrower(this.game, this.parent, this);
    } else if (type === "grenade") {
        this._gun.destroy();
        this._gun = new Grenade(this.game, this.parent, this);
    } else if (type === "rocket") {
        this._gun.destroy();
        this._gun = new Rocket(this.game, this.parent, this);
    } else if (type === "weapon-slug") {
        this._gun.destroy();
        this._gun = new Gun(this.game, this.parent, this);
    } else if (type === "rusty-sword") {
        this._gun.destroy();
        this._gun = new RustySword(this.game, this.parent, this);

    } else if (type === "explosive") {
        this._gun.destroy();
        this._gun = new Explosive(this.game, this.parent, this);
    }
}
