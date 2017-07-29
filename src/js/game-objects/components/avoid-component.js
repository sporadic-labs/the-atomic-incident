const SpriteUtils = require("../../helpers/sprite-utilities.js");

/**
 * A component that can move a parent object along a path.
 * 
 * @class AvoidComponent
 */
class AvoidComponent {
    /**
     * Creates an instance of AvoidComponent.
     * @param {Phaser.Sprite} owner An object with a position property 
     * @param {Phaser.Sprite} avoidTarget The target to avoid (object with a position property)
     * @param {number} speed Pixels per second. Note: this is the speed of the enemy when it is 
     * targeting mode. In avoid mode, it will move at a fraction of this speed.
     * @param {number} visionRadius Distance within which to avoid 
     * 
     * @memberOf AvoidComponent
     */
    constructor(owner, avoidTarget, speed, visionRadius = 400) {
        this.game = owner.game;
        this.owner = owner;
        this.speed = speed;
        this.target = avoidTarget;
        this._visionRadius = visionRadius;
        this._avoidDirection = new Phaser.Point(0, 0); // Point to be reused

        owner.alpha = 1;
        this._tween = this.game.add.tween(owner)
            .to({alpha: 0.25}, 200, Phaser.Easing.Quadratic.InOut, true, 0, -1, true);
    }

    update() {
        // Collide with other enemies
        SpriteUtils.arcadeRecursiveCollide(this.owner, this.game.globals.groups.enemies);

        Phaser.Point.subtract(this.owner.position, this.target.position, this._avoidDirection);
        const dist = this._avoidDirection.getMagnitude();
        if (dist <= this._visionRadius) {
            // Move away fast when player is near and slow when player is far. Move at a fraction of
            // full speed in order to allow the player to catch enemies.
            const avoidSpeed = (0.75 * this.speed) * (1 - (dist / this._visionRadius));
            this._avoidDirection.setMagnitude(avoidSpeed);
            this.owner.body.velocity.copyFrom(this._avoidDirection);
        }
    }

    destroy() {
        this.owner.alpha = 1;
        this.game.tweens.remove(this._tween);
    }
}

module.exports = AvoidComponent;