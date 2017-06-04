// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform float time; // Seconds, provided by Phaser
uniform vec2 center; // Coordinates of shockwave center, in world position
uniform float waveSize;
uniform float wavePos;
uniform vec2 resolution; // Resolution of the screen

void main() {
    vec2 pixelCoord = vTextureCoord * resolution; // Pixel position of fragment
    pixelCoord.y = resolution.y - pixelCoord.y; // Flip the y
    float dist = distance(pixelCoord, center); // Distance to shockwave center (pixels)
    vec2 texCoord = vTextureCoord; // Proper UV position of fragment

    // If the fragment is within range of the current wave position
    if (dist <= (wavePos + 100.0) && dist >= (wavePos - 100.0)) {
        // Hacking an equation... figure this out better
        float x = abs(dist - wavePos);
        float distortAmount = x * (1.0 - pow(x * 0.01, 0.8)) / 2000.0;
        vec2 uvDistortDirection = normalize(pixelCoord - center);
        texCoord += (uvDistortDirection * distortAmount);
    }

    gl_FragColor = texture2D(uSampler, texCoord);

    // Ported Pixi Shockwave filter: https://github.com/pixijs/pixi-filters/
    // Requires center position to be in the range 0 - 1

    // // Distance from shockwave center
    // float dist = distance(center, vTextureCoord);
    // vec2 texCoord = vTextureCoord;
    // if (dist <= (wavePos + waveSize) && dist >= (wavePos - waveSize)) {
    //     float diff = abs(dist - wavePos);
    //     float powDiff = 1.0 - pow(diff * 10.0, 0.8);
    //     float diffTime = diff * powDiff;
    //     vec2 diffUv = normalize(vTextureCoord - center);
    //     texCoord += (diffUv * diffTime);
    // }
    // gl_FragColor = texture2D(uSampler, texCoord);
}