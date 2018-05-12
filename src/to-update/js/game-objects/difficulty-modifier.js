export default class DifficultyModifier {
  constructor(initialDifficulty = null) {
    this.maxDifficulty = 1.8;
    this.minDifficulty = 1;
    this.difficulty = initialDifficulty !== null ? initialDifficulty : this.minDifficulty;

    // Emits parameters: previousDifficulty, newDifficulty
    this.onDifficultyChange = new Phaser.Signal();
  }

  setDifficulty(newDifficulty) {
    if (newDifficulty > this.maxDifficulty) newDifficulty = this.maxDifficulty;
    if (newDifficulty < this.minDifficulty) newDifficulty = this.minDifficulty;
    if (this.difficulty !== newDifficulty) {
      this.onDifficultyChange.dispatch(this.difficulty, newDifficulty);
      this.difficulty = newDifficulty;
    }
  }

  setDifficultyByFraction(fraction) {
    const newDifficulty = Phaser.Math.mapLinear(
      fraction,
      0,
      1,
      this.minDifficulty,
      this.maxDifficulty
    );
    this.setDifficulty(newDifficulty);
  }

  incrementDifficulty(delta) {
    this.setDifficulty(this.difficulty + delta);
  }

  getDifficulty() {
    return this.difficulty;
  }

  getDifficultyFraction() {
    return Phaser.Math.mapLinear(this.difficulty, this.minDifficulty, this.maxDifficulty, 0, 1);
  }

  // This could also modify damage, health, pickups, etc. based on current difficulty level

  getSpeedMultiplier() {
    return this.difficulty;
  }
}
