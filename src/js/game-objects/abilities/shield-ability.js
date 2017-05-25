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
    }

    _trigger() {
        if (this._player.ammo.length > 0) {
            // Grab the first color off of the ammo stack.
            const color = this._player.ammo.shift();
            // Set the shield color based on the current ammo.
            this._shield.baseColor = color;
            // And turn it on!
            this._shield.enabled = true;
            // Remove any active tweens and reset the cooldown.
            if (this._shieldTween) {
                this._shieldTween.stop();
            }
            this._fading = false;
            this._shieldCooldown.reset()
            // Activate the shieldCooldown.
            this._shieldCooldown.activate()
            this._pulseSound.play();
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
        this._pointer.leftButton.onDown.add(this._trigger, this);
        super.activate();
    }

    deactivate() {
        this._pointer.leftButton.onDown.remove(this._trigger, this);
        super.deactivate();
    }

    destroy() {
        this.deactivate();
        this.game.tweens.removeFrom(this._shield.baseColor);
        super.destroy();
    }
}

module.exports = ShieldAbility;