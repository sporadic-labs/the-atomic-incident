export default class DifficultyModifier {
  constructor(initialDifficulty = null) {
    this.maxDifficulty = 2;
    this.minDifficulty = 1;
    this.difficulty = initialDifficulty !== null ? initialDifficulty : this.minDifficulty;
  }

  setDifficulty(newDifficulty) {
    this.difficulty = newDifficulty;
    if (this.difficulty > this.maxDifficulty) this.difficulty = this.maxDifficulty;
    if (this.difficulty < this.minDifficulty) this.difficulty = this.minDifficulty;
  }

  incrementDifficulty(delta) {
    this.setDifficulty(this.difficulty + delta);
  }

  // This could also modify damage, health, pickups, etc. based on current difficulty level

  getSpeedMultiplier() {
    return this.difficulty;
  }
}
