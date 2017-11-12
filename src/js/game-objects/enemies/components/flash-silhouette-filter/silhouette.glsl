// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

#define PRECISION 0.0001

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform float silhouetteStrength; // In range 0 - 1
uniform vec3 silhouetteColor; // RGB

void main() {
    // Look up the pixel color from the screen's render texture
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    float isTransparent = 1. - step(PRECISION, gl_FragColor.a); // 1 if fully transparent, else 0
    vec3 newColor = mix(gl_FragColor.rgb, silhouetteColor, silhouetteStrength);
    gl_FragColor.rgb = mix(newColor, gl_FragColor.rgb, isTransparent); // Mix if not transparent
}