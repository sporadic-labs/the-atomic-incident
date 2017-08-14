// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform float factor; // Factor to use for grayscale effect, in range 0 - 1

void main() {
    // Look up the pixel color from the screen's render texture
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    // Adjust color to make it more gray by grayFactor
    gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        vec3(0.2126 * gl_FragColor.r + 0.7152 * gl_FragColor.g + 0.0722 * gl_FragColor.b), 
        factor
    );
}