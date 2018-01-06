// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

#define PRECISION 0.00001

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform float silhouetteStrength; // In range 0 - 1
uniform vec3 silhouetteColor; // RGB

void main() {
    // Look up the pixel color from the screen's render texture
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    // float isTransparent = 1. - step(PRECISION, gl_FragColor.a); // 1 if fully transparent, else 0
    // vec3 newColor = mix(gl_FragColor.rgb, silhouetteColor, silhouetteStrength);
    // gl_FragColor.rgb = mix(newColor, gl_FragColor.rgb, isTransparent); // Mix if not transparent

    // Suboptimal hack for now. Modifying the original code with a conditional to only include
    // mostly opaque pixels (a >= 0.5). The white border problem seems to be that the shader is run
    // as a pass over the screen - meaning that nearby enemies cause this shader to be run multiple
    // times per screen pixel.  
    float isMostlyOpaque = 1. - step(0.5, gl_FragColor.a); // 1 if a >= 0.5, else 0
    vec3 newColor = mix(gl_FragColor.rgb, silhouetteColor, silhouetteStrength);
    gl_FragColor.rgb = mix(newColor, gl_FragColor.rgb, isMostlyOpaque); // Mix if mostly opaque
}