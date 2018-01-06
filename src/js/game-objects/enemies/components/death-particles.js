export default class DeathParticles extends Phaser.Particles.Arcade.Emitter {
  constructor(game, parent) {
    super(game, 0, 0, 1000);
    parent.add(this);

    this._rate = 0;
    this._elapsedSeconds = 0;

    this.makeParticles("assets", "enemies/death-particles");
    this.lifespan = 500;
    this.gravity = 0;
    this.setRotation(0, 0);
    this.setAlpha(1, 0, this.lifespan, Phaser.Easing.Linear.None);
  }

  setEmitPosition(x, y) {
    this.emitX = x;
    this.emitY = y;
  }

  emitInWedge(numberToEmit, angle, angleSpread, speed, speedSpread) {
    const minSpeed = speed - speedSpread / 2;
    const maxSpeed = speed + speedSpread / 2;
    for (let i = 0; i < numberToEmit; i += 1) {
      const rndAngle = this.game.rnd.realInRange(angle - angleSpread / 2, angle + angleSpread / 2);
      const rndSpeed = this.game.rnd.realInRange(minSpeed, maxSpeed);
      // Scale is based on speed - faster particles are smaller. Speed is then binned to be one of
      // a set few values - going for a "chunky" feel over smooth variation.
      const scaleBins = [0.3, 0.65, 1];
      const scaleFraction = Phaser.Math.mapLinear(rndSpeed, minSpeed, maxSpeed, 1, 0);
      let scale = 1;
      for (const scaleBin of scaleBins) {
        if (scaleFraction < scaleBin) {
          scale = scaleBin;
          break;
        }
      }
      this.emitInDirection(rndAngle, rndSpeed, scale);
    }
  }

  emitInDirection(angle, speed = 400, scale) {
    // Get the particle that is about to be used by emitParticle
    const particle = this.getFirstExists(false);

    if (particle) {
      this.emitParticle();

      // Override the particle's settings
      particle.scale.set(scale, scale);
      particle.body.drag.setTo(5 / 4 * speed);
      particle.body.acceleration.setTo(0, 0);
      particle.body.velocity.x = speed * Math.cos(angle);
      particle.body.velocity.y = speed * Math.sin(angle);
      return particle;
    }
  }

  // update() {
  //   if (this._rate > 0) {
  //     this._elapsedSeconds += this.game.time.physicsElapsed;
  //     const numberToSpawn = Math.floor(this._rate * this._elapsedSeconds);
  //     this._elapsedSeconds -= numberToSpawn * (1 / this._rate);
  //     for (let i = 0; i < numberToSpawn; i += 1) {
  //       this.emitParticle();
  //     }
  //   }

  //   super.update();
  // }
}
