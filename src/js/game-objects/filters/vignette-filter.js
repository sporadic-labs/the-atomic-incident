const glslify = require("glslify"); // Bug requires CommonJS import: https://github.com/stackgl/glslify/issues/49

export default class VignetteFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = glslify.file("./vignette.glsl");
        this.uniforms.opacity = {type: "1f", value: 1};
        this.uniforms.resolution = {type: "2f", value: {x: game.width, y: game.height}};
        this.uniforms.center = {type: "2f", value: {x: game.width / 2, y: game.height / 2}};
        this.uniforms.radius = {type: "1f", value: 100};
        this.uniforms.edgeSoftness = {type: "1f", value: 0.6};
        this.uniforms.color = {type: "3f", value: {x: 0, y: 0, z: 0}}; // Testing out as black
    }

    update(...args) {
        this.uniforms.center.value.x = this.game.globals.player.position.x;
        this.uniforms.center.value.y = this.game.globals.player.position.y;
        // Hacky for now: match radius to light and opacity to player health
        this.uniforms.radius.value = 1.5 * this.game.globals.player._playerLight._radius;
        this.uniforms.opacity.value = 1 - this.game.globals.player._playerLight.getLightRemaining();
        super.update(...args);
    }
}