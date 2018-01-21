import MovementController from "./movement-controller";
import Controller from "../../helpers/controller.js";
import { checkSatOverlapWithGroup } from "../../helpers/sprite-utilities.js";
import EnergyPickup from "../pickups/energy-pickup";
import PlayerLight from "./player-light";
import Compass from "./compass";
import { MENU_STATE_NAMES } from "../../menu";
import { gameStore } from "../../game-data/observable-stores";
import WeaponManager from "../weapons/weapon-manager";
import MOVEMENT_TYPES from "./movement-types";
import SmokeTrail from "./smoke-trail";
import CooldownAbility from "./cooldown-ability";

const ANIM = {
  MOVE: "MOVE",
  ATTACK: "ATTACK",
  HIT: "HIT",
  DEATH: "DEATH"
};

export default class Player extends Phaser.Sprite {
  constructor(game, x, y, parentGroup) {
    super(game, x, y, "assets", "player/move");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.onDamage = new Phaser.Signal();

    this._compass = new Compass(game, parentGroup, this.width * 0.6);
    this._compass.visible = false;

    this.isDead = false;
    this._isTakingDamage = false;
    this._isDashing = false;

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Shorthand
    const globals = this.game.globals;
    this._enemies = globals.groups.enemies;
    this._pickups = globals.groups.pickups;
    this._postProcessor = globals.postProcessor;
    this._mapManager = globals.mapManager;

    this.weaponManager = new WeaponManager(game, parentGroup, this, this._enemies);

    // Configure player physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    const diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);
    this.satBody = globals.plugins.satBody.addCircleBody(this);

    // Lighting for player
    this._playerLight = new PlayerLight(game, this, {
      startRadius: 350,
      minRadius: 175,
      shrinkSpeed: 0
    });

    // Controls
    this._movementController = new MovementController(this.body, 50, 5000, 300);
    this._attackControls = new Controller(this.game.input);
    this._attackControls.addMouseDownControl("attack", Phaser.Pointer.LEFT_BUTTON);

    // Animations
    const hitFrames = Phaser.Animation.generateFrameNames(`player/hit_`, 0, 15, "", 2);
    const deathFrames = Phaser.Animation.generateFrameNames(`player/death_`, 0, 15, "", 2);
    this.animations.add(ANIM.HIT, hitFrames, 64, false).onComplete.add(() => {
      this.animations.play(ANIM.MOVE);
    }, this);
    this.animations.add(ANIM.DEATH, deathFrames, 64, false).onComplete.add(() => {
      if (this._gameOverFxComplete) {
        this.onGameOver();
        this.destroy();
      } else {
        this._gameOverFxComplete = true;
      }
    });

    // Player Sound fx
    this._hitSound = this.game.globals.soundManager.add("chiptone/player-hit", 0.03);
    this._deathSound = this.game.globals.soundManager.add("chiptone/player-death", 0.03);
    this._deathSound.onStop.add(() => {
      if (this._gameOverFxComplete) {
        this.onGameOver();
        this.destroy();
      } else {
        this._gameOverFxComplete = true;
      }
    }, this);

    this._gameOverFxComplete = false;

    this._velocity = new Phaser.Point(0, 0);

    this._trail = new SmokeTrail(game, globals.groups.background);
    this._trail.setRate(25);
  }

  update() {
    if (this.isDead) return;

    this._playerLight.update();
    this._movementController.update();
    this._attackControls.update();

    this.setInvulnerability(this._movementController.isDashing());

    // Check collisions with Tilemap.
    this.game.physics.arcade.collide(this, this._mapManager.wallLayer);

    // Update velocity after collision
    Phaser.Point.subtract(this.body.position, this.body.prev, this._velocity);
    this._velocity.divide(this.game.time.physicsElapsed, this.game.time.physicsElapsed);

    // Update the rotation of the player based on the mouse
    let mousePos = Phaser.Point.add(this.game.camera.position, this.game.input.activePointer);
    if (this._movementController._fixedAngle) {
      this.rotation = this._movementController._fixedAngle + Math.PI / 2;
    } else {
      this.rotation = this.position.angle(mousePos) + Math.PI / 2;
    }

    if (this._attackControls.isControlActive("attack") && this.weaponManager.isAbleToAttack()) {
      this.weaponManager.fire(this.position.angle(mousePos));
    }

    // "Engine" position trail
    const mc = this._movementController;
    const angleToEngine = this.rotation + Math.PI / 2;
    const offset = 10 * this.scale.x;
    const enginePosition = this.position
      .clone()
      .add(Math.cos(angleToEngine) * offset, Math.sin(angleToEngine) * offset);
    let newRate = mc.isDashing() ? 300 : mc.getSpeedFraction() * 30;
    this._trail.setEmitPosition(enginePosition.x, enginePosition.y);
    this._trail.setRate(newRate);

    // Enemy collisions
    checkSatOverlapWithGroup(this, this._enemies, this._onCollideWithEnemy, this);

    // Light pickups
    checkSatOverlapWithGroup(this, this._pickups, this._onCollideWithPickup, this);

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

    this.game.globals.audioProcessor.runLowPassFilter(500);

    if (this._playerLight.getLightRemaining() <= 0) {
      // If the player has died, play the death sound/animation.
      // The onGameOver callback will be called once the sound/animation has completed.
      this._deathSound.play();
      this.animations.play(ANIM.DEATH);
      this.isDead = true;
      this.satBody.destroy();
      this.body.destroy();
    } else {
      this._playerLight.incrementRadius(-50);
      this._hitSound.play();
    }

    // Speed boost on damage
    const originalSpeed = this._maxSpeed;
    this._maxSpeed = 2 * this._maxSpeed;

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

    this.onDamage.dispatch();
  }

  onGameOver() {
    // If the player has died, reset the camera, show the Game Over menu, and pause the game.
    this.game.camera.reset(); // Kill camera shake to prevent restarting with partial shake
    gameStore.setMenuState(MENU_STATE_NAMES.GAME_OVER);
    gameStore.updateHighScore();
    // TODO(rex): Player death animation and something interactive, instead of just pausing the game...
    gameStore.pause();
  }

  setInvulnerability(invulnerableState) {
    this._invulnerable = invulnerableState;
    this.alpha = invulnerableState ? 0.25 : 1;
  }

  _onCollideWithEnemy(self, enemy) {
    if (!this._invulnerable && !this._isTakingDamage) {
      this.takeDamage();
      this._postProcessor.onPlayerDamage();
    }
  }

  _onCollideWithPickup(self, pickup) {
    if (pickup instanceof EnergyPickup) {
      this._playerLight.incrementRadius(pickup.getEnergy());
    }
    pickup.pickUp();
  }

  destroy(...args) {
    this.onDamage.dispose();
    this._timer.destroy();
    this.game.tweens.removeFrom(this);
    this._compass.destroy();
    super.destroy(...args);
  }
}
