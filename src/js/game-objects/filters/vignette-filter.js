import fragmentSrc from "./vignette.glsl";

export default class VignetteFilter extends Phaser.Filter {
    constructor(game) {
        super(game);

        this.fragmentSrc = fragmentSrc;
        this.uniforms.opacity = {type: "1f", value: 1};
        this.uniforms.resolution = {type: "2f", value: {x: game.width, y: game.height}};
        this.uniforms.center = {type: "2f", value: {x: game.width / 2, y: game.height / 2}};
        this.uniforms.radius = {type: "1f", value: 100};
        this.uniforms.edgeSoftness = {type: "1f", value: 0.6};
        this.uniforms.color = {type: "3f", value: {x: 0, y: 0, z: 0}}; // Testing out as black
    }

    opacity(value = undefined) {
        if (value !== undefined) this.uniforms.opacity.value = value;
        return this.uniforms.opacity.value;
    }

    radius(value = undefined) {
        if (value !== undefined) this.uniforms.radius.value = value;
        return this.uniforms.radius.value;
    }
    
    center(value = undefined) {
        if (value !== undefined) {
            this.uniforms.center.value.x = value.x;
            this.uniforms.center.value.y = value.y;
        }
        return this.uniforms.center.value;
    }

    update(...args) {
        super.update(...args);
    }
}