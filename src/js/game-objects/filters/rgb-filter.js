const glslify = require("glslify"); // Bug requires CommonJS import: https://github.com/stackgl/glslify/issues/49

export default class RgbFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = glslify.file("./rgb-filter.glsl");
        this.uniforms.factor = {type: "1f", value: 0};
        this.uniforms.displacement = {type: "1f", value: 0};
        this.uniforms.resolution = {type: "2f", value: {x: game.width, y: game.height}};

        
        this.game.tweens.create(this.uniforms.displacement)
            .to({value: 20}, 200, Phaser.Easing.Bounce.In)
            .to({value: 0}, 200, Phaser.Easing.Quadratic.Out)
            .delay(1000)
            .repeatAll(-1)
            // .yoyo(true, 0, -1)
            .start();
    }

    update(...args) {
        super.update(...args);
    }
}