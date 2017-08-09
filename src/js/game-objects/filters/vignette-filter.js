const glslify = require("glslify"); // Bug requires CommonJS import: https://github.com/stackgl/glslify/issues/49

export default class VignetteFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = glslify.file("./vignette-filter.glsl");
        this.uniforms.factor = {type: "1f", value: 0.75};
        this.uniforms.resolution = {type: "2f", value: {x: game.width, y: game.height}};
        this.uniforms.center = {type: "2f", value: {x: game.width / 2, y: game.height / 2}};
        this.uniforms.radius = {type: "1f", value: 200};

        // this.game.tweens.create(this.uniforms.factor)
        //     .to({value: 1}, 400, Phaser.Easing.Bounce.InOut)
        //     .yoyo(true)
        //     .repeat(10)
        //     .start();

        this.game.tweens.create(this.uniforms.radius)
            .to({value: 150}, 300, Phaser.Easing.Linear.InOut, true, 0, -1)
            .yoyo(true, 0);
    }

    update(...args) {
        this.uniforms.center.value.x = this.game.globals.player.position.x;
        this.uniforms.center.value.y = this.game.globals.player.position.y;
        super.update(...args);
    }
}