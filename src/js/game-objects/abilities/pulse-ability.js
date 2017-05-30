const Ability = require("./ability");
const spriteUtils = require("../../helpers/sprite-utilities.js");

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
    }

    _fire() {
        if (this._player.ammo.length > 0) {
            const color = this._player.ammo.shift();
            this._flashlight.pulseColor = color;
            this._effects.lightFlash(color.getRgbColorInt());
            this._flashlight.startPulse();
            this.game.globals.postProcessor.startWave(this._player.position);
            this._pulseSound.play();
        }

    }

    update() {
        if (!this._flashlight.isPulseActive()) return;

        // Damage enemies
        const damage = this._damage * this.game.time.physicsElapsed;
        spriteUtils.forEachRecursive(this._enemies, function (child) {
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
        }, this);

        // Trigger pickups when the lights collide.
        // spriteUtils.forEachRecursive(this._pickups, function (pickup) {
        //     // MH: why does world position not work here...
        //     var inLight = this._flashlight.isPointInPulse(pickup.position);
        //     if (inLight) pickup.destroy();
        // }, this);
    }

    activate() {
        this._pointer.leftButton.onDown.add(this._fire, this);
        super.activate();
    }

    deactivate() {
        this._pointer.leftButton.onDown.remove(this._fire, this);
        super.deactivate();
    }

    destroy() {
        this.deactivate();
        super.destroy();
    }
}

module.exports = PulseAbility;