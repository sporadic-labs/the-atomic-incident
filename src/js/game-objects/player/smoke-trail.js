export default class SmokeTrail extends Phaser.Particles.Arcade.Emitter {
  constructor(game, parent) {
    super(game, 0, 0, 1000);
    parent.add(this);

    this._rate = 0;
    this._elapsedSeconds = 0;

    this.makeParticles("assets", "player/player-trail");
    this.lifespan = 500;
    this.gravity = 0;
    this.setRotation(180, 180);
    this.setScale(0.5, 1, 0.5, 1, this.lifespan, Phaser.Easing.Quadratic.In);
    this.setAlpha(0.7, 0.4, this.lifespan, Phaser.Easing.Linear.None);
    this.setXSpeed(-50, 50);
    this.setYSpeed(-50, 50);
  }

  setRate(rate) {
    this._rate = rate;
    if (rate === 0) this._elapsedSeconds = 0;
  }

  setEmitPosition(x, y) {
    this.emitX = x;
    this.emitY = y;
  }

  update() {
    if (this._rate > 0) {
      this._elapsedSeconds += this.game.time.physicsElapsed;
      const numberToSpawn = Math.floor(this._rate * this._elapsedSeconds);
      this._elapsedSeconds -= numberToSpawn * (1 / this._rate);
      for (let i = 0; i < numberToSpawn; i += 1) {
        this.emitParticle();
      }
    }

    super.update();
  }
}
