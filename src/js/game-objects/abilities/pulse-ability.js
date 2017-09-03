const Ability = require("./ability");
import Color from "../../helpers/color";

class PulseAbility extends Ability {
  /**
     * Creates an instance of PulseAbility.
     * @param {Phaser.Game} game
     * @param {Player} player
     *
     * @memberof PulseAbility
     */
  constructor(game, player, damage) {
    super(game, player);

    this._damage = damage;

    this._input = game.input;
    this._pointer = this._input.activePointer;
    this._effects = game.globals.plugins.effects;
    this._enemies = game.globals.groups.enemies;
    this._pickups = game.globals.groups.pickups;
    this._flashlight = this._player.flashlight;
    this._pulseSound = game.globals.soundManager.add("impact-2");
    this._pulseSound.playMultiple = true;

    this._ammoManager = game.globals.ammoManager;

    const keyboard = game.input.keyboard;
    const KEYCODE = Phaser.KeyCode;
    this._redKey = keyboard.addKey(KEYCODE.ONE);
    this._greenKey = keyboard.addKey(KEYCODE.TWO);
    this._blueKey = keyboard.addKey(KEYCODE.THREE);
  }

  _fire(color) {
    const colorAmmo = this._ammoManager.getAmmoByColor(color);
    if (colorAmmo > 0) {
      this._flashlight.pulseColor = color;
      this._effects.lightFlash(color.getRgbColorInt());
      this._flashlight.startPulse();
      this.game.globals.postProcessor.startWave(this._player.position);
      this._pulseSound.play();
      this._ammoManager.incrementAmmoByColor(color, -1);
    }
  }

  update() {
    if (!this._flashlight.isPulseActive()) return;

    // Damage enemies
    const damage = this._damage * this.game.time.physicsElapsed;
    spriteUtils.forEachRecursive(
      this._enemies,
      function(child) {
        if (child instanceof Phaser.Sprite && child.takeDamage) {
          // MH: why does world position not work here...
          const inLight = this._flashlight.isPointInPulse(child.position);
          if (inLight) {
            const flashlightColor = this._flashlight.pulseColor;
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
  }

  activate() {
    this._redKey.onDown.add(() => this._fire(Color.red()), this);
    this._greenKey.onDown.add(() => this._fire(Color.green()), this);
    this._blueKey.onDown.add(() => this._fire(Color.blue()), this);
    super.activate();
  }

  deactivate() {
    this._redKey.onDown.removeAll(this);
    this._greenKey.onDown.removeAll(this);
    this._blueKey.onDown.removeAll(this);
    super.deactivate();
  }

  destroy() {
    this.deactivate();
    super.destroy();
  }
}

module.exports = PulseAbility;
