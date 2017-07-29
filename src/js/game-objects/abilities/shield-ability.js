const Ability = require("./ability");
const spriteUtils = require("../../helpers/sprite-utilities.js");
const colors = require("../../constants/colors.js");
var CooldownAbility = require("../components/cooldown-ability.js");

class ShieldAbility extends Ability {

    /**
     * Creates an instance of Shield Ability.
     * @param {Phaser.Game} game
     * @param {Player} player
     * @param {number} damage
     * @param {number} radius - radius of shield.
     * @param {number} duration - how long should the shield last, in ms.
     *
     * @memberof ShieldAbility
     */
    constructor(game, player, damage, radius, duration) {
        super(game, player);

        this.game = game;
        this._damage = damage;
        this._shieldRadius = radius

        this._input = game.input;
        this._player = player;
        this._pointer = this._input.activePointer;
        this._effects = game.globals.plugins.effects;
        this._enemies = game.globals.groups.enemies;
        this._pickups = game.globals.groups.pickups;
        this._flashlight = this._player.flashlight;
        this._lighting = game.globals.plugins.lighting;

        this._pulseSound = game.globals.soundManager.add("impact-2");
        this._pulseSound.playMultiple = true;

        this._ammoManager = game.globals.ammoManager;

        // Flag for determining if the shield is in the process of fading.
        this._fading = false;

        // Add a new light to serve as the shield.
        this._shield = this._lighting.addLight(
            new Phaser.Point(0, 0),
            new Phaser.Circle(0, 0, this._shieldRadius),
            colors.red.clone().setTo({a: 155}),
            colors.red
        );
        this._shield.enabled = false;
        // Cooldown component for shield duration.
        this._shieldCooldown = new CooldownAbility(this.game, duration, 0, "shield");
        this._shieldTween = null;

        const keyboard = game.input.keyboard;
        const KEYCODE = Phaser.KeyCode;
        this._redKey = keyboard.addKey(KEYCODE.ONE);
        this._greenKey = keyboard.addKey(KEYCODE.TWO);
        this._blueKey = keyboard.addKey(KEYCODE.THREE);
    }

    _trigger(color) {
        const colorAmmo = this._ammoManager.getAmmoByColor(color);
        if (colorAmmo > 0) {
            // Set the shield color based on the current ammo.
            this._shield.baseColor = color;
            this._shield.baseColor.setTo({a: 155});

            // And turn it on!
            this._shield.enabled = true;
            // Remove any active tweens and reset the cooldown.
            if (this._shieldTween) {
                this._shieldTween.stop();
                this.game.tweens.remove(this._shieldTween);
            }
            this._fading = false;
            this._shieldCooldown.reset()
            // Activate the shieldCooldown.
            this._shieldCooldown.activate()
            this._pulseSound.play();

            this._ammoManager.incrementAmmoByColor(color, -1);
        }
    }

    update() {
        // Update shield position.
        this._shield.position.copyFrom(this._player.position);

        // If the shield is off, we don't need to worry about collisions.
        if (!this._shield.enabled) return;

        // If the shield is in the last 25% of its life, blink!
        if (this._shieldCooldown.getCooldownProgress() > 0.75 && !this._fading) {
            this._fading = true;
            this._shieldTween = this.game.make.tween(this._shield.baseColor)
                .to({ a: 120 }, 200, "Quad.easeInOut", true, 0, 5, true);
            // When tween is over, turn off the shield.
            this._shieldTween.onComplete.add(function() {
                this._shield.enabled = false;
                this._fading = false;
            }, this);
        }

        // Damage enemies
        const damage = this._damage * this.game.time.physicsElapsed;
        spriteUtils.forEachRecursive(this._enemies, function (child) {
            if (child instanceof Phaser.Sprite && child.takeDamage) {
                // MH: why does world position not work here...
                const inLight = this._shield.isPointInLight(child.position);
                if (inLight) {
                    const lightColor = this._shield.baseColor;
                    const enemyColor = child._shield ? child._shieldColor : child.color;

                    // If the enemy color matches the flashlight color, then the enemies
                    // should take damage.
                    const matchingLights = lightColor.rgbEquals(enemyColor);
                    if (matchingLights) {
                        if (child._shield) child.damageShield(damage);
                        else child.takeDamage(damage);
                    }
                }
            }
        }, this);
    }

    activate() {
        this._redKey.onDown.add(() => this._trigger(colors.red), this);
        this._greenKey.onDown.add(() => this._trigger(colors.green), this);
        this._blueKey.onDown.add(() => this._trigger(colors.blue), this);
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

module.exports = ShieldAbility;