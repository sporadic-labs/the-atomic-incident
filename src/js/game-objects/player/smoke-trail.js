export default class SmokeTrail {
  constructor(scene, sprite) {
    // Particle manager - responsible for multiple emitters & setting particle texture for emitters
    this.particles = scene.add.particles("assets", "player/player-trail");

    this.emitter = this.particles.createEmitter({
      speed: { min: 0, max: 75 },
      alpha: { start: 0.7, end: 0, ease: "Linear" },
      scale: { start: 0.5, end: 1, ease: "Quad.easeIn" },
      lifespan: 500,
      on: false // Manual control of particle emission
    });

    this.sprite = sprite;
    this.elapsedSeconds = 0;
    this.rate = 0;
  }

  setStrength(fraction) {
    this.rate = Phaser.Math.Linear(0, 200, fraction);
  }

  update(time, delta) {
    // Offset engine from sprite
    const engineOffset = new Phaser.Math.Vector2().setToPolar(
      this.sprite.rotation + Math.PI / 2,
      10
    );
    this.emitter.setPosition(this.sprite.x + engineOffset.x, this.sprite.y + engineOffset.y);

    // Phaser emitters don't do rate over time well. It uses specific discrete quantity at
    // "frequency" (delay between particles), so roll our own smoother particle flow
    if (this.rate > 0) {
      this.elapsedSeconds += delta / 1000;
      const numberToSpawn = Math.floor(this.rate * this.elapsedSeconds);
      if (numberToSpawn > 0) {
        this.elapsedSeconds -= numberToSpawn * (1 / this.rate);
        this.emitter.emitParticle(numberToSpawn);
      }
    }
  }

  destroy() {
    this.particles.destroy();
  }
}
