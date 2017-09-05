import Controller from "../../helpers/controller.js";
import { checkOverlapWithGroup } from "../../helpers/sprite-utilities.js";
import Scattershot from "../weapons/scattershot";
import EnergyPickup from "../pickups/energy-pickup";
import PlayerLight from "../lights/player-light";
import Compass from "./compass";

const ANIM_NAMES = {
  IDLE: "idle",
  MOVE: "move",
  ATTACK: "attack",
  HIT: "hit",
  DIE: "die"
};

export default class Player extends Phaser.Sprite {
  constructor(game, x, y, parentGroup) {
    super(game, x, y, "assets", "player/idle-01");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._compass = new Compass(game, parentGroup, this.width * 0.6);

    this._isTakingDamage = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    // NOTE(rex): Not quite sure if this should be a part of the player or not...
    this.damage = 10000;

    this.weapon = new Scattershot(game, parentGroup, this);

    // Shorthand
    const globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._postProcessor = globals.postProcessor;
    this._mapManager = globals.mapManager;

    // Setup animations
    const idleFrames = Phaser.Animation.generateFrameNames("player/idle-", 1, 4, "", 2);
    const moveFrames = Phaser.Animation.generateFrameNames("player/move-", 1, 4, "", 2);
    const attackFrames = Phaser.Animation.generateFrameNames("player/attack-", 2, 4, "", 2);
    const hitFrames = Phaser.Animation.generateFrameNames("player/hit-", 1, 4, "", 2);
    const dieFrames = Phaser.Animation.generateFrameNames("player/die-", 1, 4, "", 2);
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
    const diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);

    this.satBody = globals.plugins.satBody.addCircleBody(this);

    // Lighting for player
    this._playerLight = new PlayerLight(game, this, {
      startRadius: 300,
      minRadius: 100,
      shrinkSpeed: 10
    });

    /** PLAYER CONTROLS */
    this._controls = new Controller(this.game.input);
    const Kb = Phaser.Keyboard;
    const P = Phaser.Pointer;

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

    // TODO(rex): What to do with abilities?
    this._controls.addMouseDownControl("ability", [P.RIGHT_BUTTON]);

    // Player Sound fx
    this._hitSound = this.game.globals.soundManager.add("smash", 0.03);
    this._hitSound.playMultiple = true;
    this._dashSound = this.game.globals.soundManager.add("warp");
    this._dashSound.playMultiple = true;
    this.pickupSound = this.game.globals.soundManager.add("whoosh");

    this._velocity = new Phaser.Point(0, 0);
  }

  update() {
    this._playerLight.update();

    // Update keyboard/mouse inputs
    this._controls.update();

    // Calculate the acceleration and heading from the keyboard.
    let acceleration = new Phaser.Point(0, 0);
    if (
      this._controls.isControlActive("move-left") ||
      this._controls.isControlActive("arrow-left")
    ) {
      acceleration.x += -1;
    } else if (
      this._controls.isControlActive("move-right") ||
      this._controls.isControlActive("arrow-right")
    ) {
      acceleration.x += 1;
    }
    if (this._controls.isControlActive("move-up") || this._controls.isControlActive("arrow-up")) {
      acceleration.y += -1;
    } else if (
      this._controls.isControlActive("move-down") ||
      this._controls.isControlActive("arrow-down")
    ) {
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
      const dragMagnitude = this._customDrag * this.game.time.physicsElapsed;
      if (this.body.velocity.getMagnitude() < dragMagnitude) {
        // Snap to 0 velocity so that we avoid the drag causing the velocity
        // to flip directions and end up oscillating
        this.body.velocity.set(0);
      } else {
        // Apply drag in opposite direction of velocity
        const drag = this.body.velocity.clone().setMagnitude(-1 * dragMagnitude);
        this.body.velocity.add(drag.x, drag.y);
      }
    }

    // Check collisions with Tilemap.
    this.game.physics.arcade.collide(this, this._mapManager.wallLayer);

    // Update velocity after collision
    Phaser.Point.subtract(this.body.position, this.body.prev, this._velocity);
    this._velocity.divide(this.game.time.physicsElapsed, this.game.time.physicsElapsed);

    // Update the rotation of the player based on the mouse
    const mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    this.rotation = this.position.angle(mousePos) + Math.PI / 2;

    if (
      this._controls.isControlActive("attack") &&
      this.weapon.isAbleToAttack() &&
      !this.weapon.isAmmoEmpty()
    ) {
      this.weapon.fire(this.position.angle(mousePos));
    }

    // Enemy collisions
    checkOverlapWithGroup(this, this._enemies, this._onCollideWithEnemy, this);

    // Light pickups
    checkOverlapWithGroup(this, this._pickups, this._onCollideWithPickup, this);

    const health = this._playerLight.getLightRemaining();
    this._postProcessor.onHealthUpdate(health);
  }

  getHealth() {
    return this._playerLight.getLightRemaining();
  }

  getLightRadius() {
    return this._playerLight.getRadius();
  }

  getVelocity() {
    return this._velocity;
  }

  postUpdate(...args) {
    // Update components after the player
    this._playerLight.centerOnPlayer();
    this._compass.repositionAt(this.position, this.rotation);

    super.postUpdate(...args);
  }

  takeDamage() {
    // If player is already taking damage, nothing else to do
    if (this._isTakingDamage) return;

    if (this._playerLight.getLightRemaining() <= 0) {
      this.game.camera.reset(); // Kill camera shake to prevent restarting with partial shake
      this.game.state.restart();
    } else {
      this._playerLight.incrementRadius(-50);
    }

    // Speed boost on damage
    const originalSpeed = this._maxSpeed;
    this._maxSpeed = 2 * this._maxSpeed;

    // Reset the score and combo.
    this.game.globals.comboTracker.updateScoreAndResetCombo();

    // Flicker tween to indicate when player is invulnerable
    this._isTakingDamage = true;
    const tween = this.game.make
      .tween(this)
      .to({ alpha: 0.25 }, 100, "Quad.easeInOut", true, 0, 5, true);

    // When tween is over, reset
    tween.onComplete.add(function() {
      this._isTakingDamage = false;
      this._maxSpeed = originalSpeed;
    }, this);
  }

  _onCollideWithEnemy(self, enemy) {
    if (!this._invulnerable && enemy._spawned && !this._isTakingDamage) {
      this.takeDamage();
      // this._hitSound.play();
      this._postProcessor.onPlayerDamage();
    }
  }

  _onCollideWithPickup(self, pickup) {
    if (pickup instanceof EnergyPickup) {
      this._playerLight.incrementRadius(pickup.getEnergy());
    }
    this.pickupSound.play();
    pickup.pickUp();
  }

  destroy(...args) {
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    for (const key in this._weapons) {
      this._weapons[key].destroy();
    }
    this._compass.destroy();
    super.destroy(...args);
  }
}
