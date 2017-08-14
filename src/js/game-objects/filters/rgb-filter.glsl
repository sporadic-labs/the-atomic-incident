// See built-in uniforms: https://photonstorm.github.io/phaser-ce/Phaser.Filter.html

precision mediump float;

varying vec2 vTextureCoord; // UV coorindates provided by Phaser, in range 0 - 1
uniform sampler2D uSampler; // Texture, provided by Phaser
uniform vec2 resolution; // Resolution of the screen
uniform float time; // Seconds, provided by Phaser
uniform float displacement; // Pixels

void main() {
    // Pixels to UV displacement, based on horizontal resolution
    float uvDisplacement = displacement / resolution.x;
    // Calculate the direction to displace, using time as an angle
    vec2 direction = vec2(cos(time), sin(time));
    // Pull the normal RGB color and then displace the R and B channels in opposite directions
    gl_FragColor = texture2D(uSampler, vTextureCoord);
    gl_FragColor.r = texture2D(uSampler, vTextureCoord + (uvDisplacement * direction)).r;
    gl_FragColor.b = texture2D(uSampler, vTextureCoord + (uvDisplacement * -direction)).b;
}