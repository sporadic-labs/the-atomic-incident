const Ability = require("./ability");
const spriteUtils = require("../../helpers/sprite-utilities.js");
const colors = require("../../constants/colors");

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

        this._input = game.input;
        this._pointer = this._input.activePointer;
        this._effects = game.globals.plugins.effects;
        this._enemies = game.globals.groups.enemies;
        this._pickups = game.globals.groups.pickups;
        this._lighting = game.globals.plugins.lighting;

        this._mines = [];
    }

    _placeMine() {
        if (this._player.ammo.length > 0) {
            const color = this._player.ammo.shift();
            const pos = this._player.position;
            const sprite = this.game.add.sprite(pos.x, pos.y, "assets", "fx/hit-04"); // Temp visual
            sprite.tint = color.getRgbColorInt();
            sprite.scale.set(1.25);
            sprite.anchor.set(0.5);
            this.game.physics.arcade.enable(sprite);
            const light = this._lighting.addLight(
                pos, new Phaser.Circle(0, 0, 50), color.clone().setTo({a: 155}), color
            );
            this._mines.push({color, sprite, light, isTriggered: false});
        }
    }

    _activateMine(index) {
        const mine = this._mines[index];
        mine.isTriggered = true;
        mine.sprite.destroy();
        mine.light.destroy();
        mine.light = this._lighting.addLight(
            mine.sprite.position,
            new Phaser.Circle(0, 0, this._explosionRadius),
            mine.color.clone().setTo({a: 0}),
            mine.color
        );
        this._effects.lightFlash(mine.color.getRgbColorInt());
        mine.light.startPulse(this._explosionSpeed);
        this.game.globals.postProcessor.startWave(mine.light.position);
    }

    update() {
        for (let i = this._mines.length - 1; i >= 0; i--) {
            const mine = this._mines[i];

            if (!mine.isTriggered) {
                // Check if an ememy has walked over a mine
                spriteUtils.forEachRecursive(this._enemies, function (enemy) {
                    if (this.game.physics.arcade.overlap(mine.sprite, enemy)) {
                        this._activateMine(i);
                        return true;
                    }
                }, this);
            } else {
                // Check if a triggered mine is done exploding
                if (!mine.light.isPulseActive()) {
                    mine.light.destroy();
                    this._mines.splice(i, 1);
                } else {
                    // Damage enemies
                    const damage = this._mineDamage * this.game.time.physicsElapsed;
                    spriteUtils.forEachRecursive(this._enemies, function (child) {
                        if (child instanceof Phaser.Sprite && child.takeDamage) {
                            // MH: why does world position not work here...
                            const inLight = mine.light.isPointInPulse(child.position);
                            if (inLight) {
                                const flashlightColor = mine.light.pulseColor;
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
                    spriteUtils.forEachRecursive(this._pickups, function (pickup) {
                        // MH: why does world position not work here...
                        var inLight = mine.light.isPointInPulse(pickup.position);
                        if (inLight) pickup.destroy();
                    }, this);
                }
            }
        }


    }

    activate() {
        this._pointer.leftButton.onDown.add(this._placeMine, this);
        super.activate();
    }

    deactivate() {
        this._pointer.leftButton.onDown.remove(this._placeMine, this);
        super.deactivate();
    }

    destroy() {
        for (const mine of this._mines) mine.destroy();
        this._mines = null;
        this.deactivate();
        super.destroy();
    }
}

module.exports = MineAbility;