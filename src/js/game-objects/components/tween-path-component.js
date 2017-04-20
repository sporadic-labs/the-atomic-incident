/**
 * A component that can move a parent object along a path.
 * 
 * @class TweenPathComponent
 */
class TweenPathComponent {
    /**
     * Creates an instance of TweenPathComponent.
     * @param {any} owner An object with a position property 
     * @param {Path} path A path instance 
     * @param {number} speed Pixels per second 
     * @param {boolean} [shouldRepeat=true] Whether the tween should loop
     * @param {boolean} [shouldPingPong=true] Whether the tween should ping pong
     * 
     * @memberOf TweenPathComponent
     */
    constructor(owner, path, speed, shouldRepeat = true, 
            shouldPingPong = true) {
        this.game = owner.game;
        this.owner = owner;

        this._positionAlongPath = 0;
        const length = this._path.getLength();
        const duration = length / speed * 1000;
        
        this._tween = this.game.make.tween(this)
            .to({_positionAlongPath: length}, duration, "Quad.easeInOut", 
                true, 0, shouldRepeat, shouldPingPong);
    }

    update() {
        const point = this._path.getPointAtLength(this._positionAlongPath);
        this.owner.position.copyFrom(point);
    }

    destroy() {
        this._game.tweens.remove(this._tween);
    }
}

module.exports = TweenPathComponent;