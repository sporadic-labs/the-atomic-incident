precision mediump float;

// Phaser built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html
varying vec2 vTextureCoord; // UV coorindates, in range 0 - 1
uniform sampler2D uSampler; // Texture
uniform float time; // Seconds

// Custom uniforms
uniform vec2 resolution; // Resolution of the screen
uniform float opacity; // Overall strength of the vignette, in range 0 - 1
uniform vec2 center; // Coordinates of vignette center, in world position
uniform float radius; // Vignette radius
uniform float edgeSoftness; // Soften factor of the vignette's edge (1 = smooth, 0 = sharp)
uniform vec3 color; // Vignette color

// Return a value between 0 or 1 indicating the value of the vignette at the current location
// Based on the helpful tutorial at: https://github.com/mattdesl/lwjgl-basics/wiki/ShaderLesson3
float vignette(vec2 location, vec2 vignetteCenter, float vignetteRadius, float edgeSoftness) {
    float dist = distance(location, vignetteCenter);
    float halfRadius = vignetteRadius / 2.0;
    // Start distance and end distance for the vignette effect. Edge softness is used to control how
    // quickly the vignette drops off.
    //  Soft = 1, vignette fades in starting at 0px & reaches full strength at radius
    //  Soft = 0, vignette fades in at half radius & reaches full strength at half radius, i.e. 
    //  instant transition
    float vignetteShrinkage = (1.0 - edgeSoftness) * halfRadius; // Pull start & end closer
    float start = vignetteShrinkage;
    float end = vignetteRadius - vignetteShrinkage;
    // Interpolate (& clamp) a value between 0 and 1 based on the distance from the center
    return smoothstep(start, end, dist);
}

// Return a color based on applying horizontal scanlines. If the color is in the y position of a
// scanline, the color is darkened by lineOpacity (0 - 1). E.g. lineOpacity = 1, scanlines are 
// black. linePixelHeight is the height of the scanline in pixels.
// Inspired by: https://gist.github.com/code-disaster/869c1c47d8b708dc2458538907445952
vec3 scanlines(vec3 originalColor, float y, float lineOpacity, float linePixelHeight) {
    float yScaled = floor(y / linePixelHeight); // Scaling y down = scaling line up
    float isOnLine = mod(yScaled, 2.0); // Odd values of y return 1
    float muliplier = isOnLine * lineOpacity;
    return originalColor * muliplier;
}

void main() {
    vec2 pixelCoord = vTextureCoord * resolution; // Pixel position of fragment
    pixelCoord.y = resolution.y - pixelCoord.y; // Flip the y

    // Find strength of the vignette at this pixel location
    float strength = opacity * vignette(pixelCoord, center, radius, edgeSoftness);

    // Look up the pixel color from the screen's render texture
    vec4 outputColor = texture2D(uSampler, vTextureCoord);

    // Apply the vignette color
    outputColor.rgb = mix(outputColor.rgb, color, strength);

    // Apply scanlines
    vec3 scanColor = scanlines(outputColor.rgb, pixelCoord.y, 0.7, 3.0);
    outputColor.rgb = mix(outputColor.rgb, scanColor, strength);

    gl_FragColor = outputColor;
}