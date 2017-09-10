import MovementController from "./movement-controller";
import Controller from "../../helpers/controller.js";
import { checkOverlapWithGroup } from "../../helpers/sprite-utilities.js";
import Scattershot from "../weapons/scattershot";
import EnergyPickup from "../pickups/energy-pickup";
import PlayerLight from "./player-light";
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

    // Controls
    this._movementController = new MovementController(this.body, 50, 5000, 100);
    this._attackControls = new Controller(this.game.input);
    this._attackControls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);

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
    this._movementController.update();
    this._attackControls.update();

    // Check collisions with Tilemap.
    this.game.physics.arcade.collide(this, this._mapManager.wallLayer);

    // Update velocity after collision
    Phaser.Point.subtract(this.body.position, this.body.prev, this._velocity);
    this._velocity.divide(this.game.time.physicsElapsed, this.game.time.physicsElapsed);

    // Update the rotation of the player based on the mouse
    const mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    this.rotation = this.position.angle(mousePos) + Math.PI / 2;

    if (
      this._attackControls.isControlActive("attack") &&
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
