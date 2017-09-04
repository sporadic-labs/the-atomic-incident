import fragmentSrc from "./shockwave.glsl";

export default class Shockwave extends Phaser.Filter {
  constructor(game) {
    super(game);

    this.fragmentSrc = fragmentSrc;
    this.uniforms.wavePos = { type: "1f", value: 0 };
    this.uniforms.waveSize = { type: "1f", value: 0.1 };
    this.uniforms.center = { type: "2f", value: { x: 0.5, y: 0.5 } };
    this.uniforms.resolution = { type: "2f", value: { x: game.width, y: game.height } };
  }

  startWave(position) {
    // This should probably do a tween - like how the light pulses work
    this.wavePosition = 0;
    this.uniforms.center.value = {
      x: position.x,
      y: position.y
    };
  }

  update(...args) {
    this.wavePosition += 6;
    super.update(...args);
  }

  set wavePosition(newPosition) {
    this.uniforms.wavePos.value = newPosition;
  }
  get wavePosition() {
    return this.uniforms.wavePos.value;
  }
}
