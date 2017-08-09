const glslify = require("glslify"); // Bug requires CommonJS import: https://github.com/stackgl/glslify/issues/49

export default class GrayscaleFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = glslify.file("./grayscale-filter.glsl");
        this.uniforms.factor = {type: "1f", value: 0};
    }

    fadeToGray(time) {
        this._tween = this.game.tweens.create(this.uniforms.factor)
            .to({value: 1}, time, Phaser.Easing.Quadratic.InOut)
            .start();
    }

    fadeToNormal(time) {
        if (this._tween) {
            this._tween.stop()
                .to({factor: 0}, time, Phaser.Easing.Quadratic.InOut)
                .start();
        }
    }

    update(...args) {
        console.log(this.uniforms.factor.value);
        super.update(...args);
    }
}