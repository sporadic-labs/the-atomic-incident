// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

// Helpful tutorial: https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson3

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform float factor; // Factor to use for grayscale effect, in range 0 - 1
uniform vec2 center; // Coordinates of vignette center, in world position
uniform vec2 resolution; // Resolution of the screen
uniform float radius; // Vignette radius
uniform float time; // Vignette radius

void main() {
    vec2 pixelCoord = vTextureCoord * resolution; // Pixel position of fragment
    pixelCoord.y = resolution.y - pixelCoord.y; // Flip the y
    float dist = distance(pixelCoord, center); // Distance to vignette center (pixels)

    // Strength of vignette at this point. Smoothly interpolate dist between 0 and 1 (clamped)
    float strength = factor * smoothstep(0.0, radius, dist);
    
    // Look up the pixel color from the screen's render texture
    gl_FragColor = texture2D(uSampler, vTextureCoord);

    // Adjust color to make it more gray by grayFactor
    gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        vec3(1.0, 0.0, 0.0), 
        strength
    );
    
    float fmin = 0.5;
    float fmod = mod((vTextureCoord * resolution).y, 4.0);
    float fstep = fmin + (1.0 - fmin) * fmod;
    gl_FragColor.rgb = mix(
        gl_FragColor.rgb,
        vec3(gl_FragColor.rgb * fstep), 
        strength
    );

    // Step to make scanlines
    // Pow to make vignette tighter
}