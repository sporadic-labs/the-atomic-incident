const Ability = require("./ability");
const spriteUtils = require("../../helpers/sprite-utilities.js");
import Color from "../../helpers/color";

class MineAbility extends Ability {
  /**
     * Creates an instance of MineAbility.
     * @param {Phaser.Game} game
     * @param {Player} player
     *
     * @memberof MineAbility
     */
  constructor(game, player, mineDamage, explosionSpeed, explosionRadius) {
    super(game, player);

    this._mineDamage = mineDamage;
    this._explosionRadius = explosionRadius;
    this._explosionSpeed = explosionSpeed;
    this._throwSpeed = 400;

    this._ammoManager = game.globals.ammoManager;
    this._pointer = game.input.activePointer;

    this._mineGroup = game.make.group(undefined, "Mines");

    const keyboard = game.input.keyboard;
    const KEYCODE = Phaser.KeyCode;
    this._redKey = keyboard.addKey(KEYCODE.ONE);
    this._greenKey = keyboard.addKey(KEYCODE.TWO);
    this._blueKey = keyboard.addKey(KEYCODE.THREE);
  }

  _placeMine(color) {
    const colorAmmo = this._ammoManager.getAmmoByColor(color);
    if (colorAmmo > 0) {
      const pos = this._player.position;
      const speed = Phaser.Point
        .subtract(this._pointer.position, pos)
        .setMagnitude(this._throwSpeed);
      new Mine(
        this.game,
        pos,
        this._mineGroup,
        speed,
        color,
        this._mineDamage,
        this._explosionSpeed,
        this._explosionRadius
      );
      this._ammoManager.incrementAmmoByColor(color, -1);
    }
  }

  activate() {
    this._redKey.onDown.add(() => this._placeMine(Color.red()), this);
    this._greenKey.onDown.add(() => this._placeMine(Color.green()), this);
    this._blueKey.onDown.add(() => this._placeMine(Color.blue()), this);
    super.activate();
  }

  deactivate() {
    this._redKey.onDown.removeAll(this);
    this._greenKey.onDown.removeAll(this);
    this._blueKey.onDown.removeAll(this);
    super.deactivate();
  }

  destroy() {
    this._mineGroup.destroy(true);
    this.deactivate();
    super.destroy();
  }
}

class Mine extends Phaser.Sprite {
  constructor(game, position, parent, velocity, color, damage, explosionSpeed, explosionRadius) {
    super(game, position.x, position.y, "assets", "fx/hit-04");
    parent.addChild(this);
    this.tint = color.getRgbColorInt();
    this.scale.set(1.25);
    this.anchor.set(0.5);
    this.game.physics.arcade.enable(this);
    this.body.velocity = velocity;
    this.body.collideWorldBounds = true;

    this._color = color;
    this._isTriggered = false;
    this._damage = damage;
    this._explosionSpeed = explosionSpeed;
    this._explosionRadius = explosionRadius;
    this._effects = game.globals.plugins.effects;
    this._enemies = game.globals.groups.enemies;
    this._pickups = game.globals.groups.pickups;
    this._levelManager = game.globals.levelManager;
    this._light = game.globals.plugins.lighting.addLight(
      position,
      new Phaser.Circle(0, 0, 50),
      color.clone().setTo({ a: 155 }),
      color
    );
  }

  update() {
    this.game.physics.arcade.collide(this, this._levelManager.getCurrentWallLayer());
    this._light.position.copyFrom(this.position);

    if (!this._isTriggered) {
      // Apply custom drag
      this.body.velocity.multiply(0.95, 0.95);
      spriteUtils.forEachRecursive(
        this._enemies,
        function(enemy) {
          if (this.game.physics.arcade.overlap(this, enemy)) {
            this.trigger();
            return true;
          }
        },
        this
      );
    } else {
      // Check if a triggered mine is done exploding
      if (!this._light.isPulseActive()) {
        this.destroy();
      } else {
        // Damage enemies
        const damage = this._damage * this.game.time.physicsElapsed;
        spriteUtils.forEachRecursive(
          this._enemies,
          function(child) {
            if (child instanceof Phaser.Sprite && child.takeDamage) {
              // MH: why does world position not work here...
              const inLight = this._light.isPointInPulse(child.position);
              if (inLight) {
                const flashlightColor = this._light.pulseColor;
                const enemyColor = child._shield ? child._shieldColor : child.color;

                // If the enemy color matches the flashlight color, then the enemies
                // should take damage.
                const matchingLights = flashlightColor.rgbEquals(enemyColor);
                if (matchingLights) {
                  if (child._shield) child.damageShield(damage);
                  else child.takeDamage(damage);
                }
              }
            }
          },
          this
        );

        // Trigger pickups when the lights collide.
        spriteUtils.forEachRecursive(
          this._pickups,
          function(pickup) {
            // MH: why does world position not work here...
            var inLight = this._light.isPointInPulse(pickup.position);
            if (inLight) pickup.destroy();
          },
          this
        );
      }
    }
  }

  trigger() {
    this.body.velocity.set(0, 0);
    this._isTriggered = true;
    this.alpha = 0;
    this._light.setShape(new Phaser.Circle(0, 0, this._explosionRadius));
    this._light.baseColor.setTo({ a: 0 });
    this._effects.lightFlash(this._color.getRgbColorInt());
    this._light.startPulse(this._explosionSpeed);
    this.game.globals.postProcessor.startWave(this.position);
  }

  destroy() {
    this._light.destroy();
    super.destroy();
  }
}

module.exports = MineAbility;
