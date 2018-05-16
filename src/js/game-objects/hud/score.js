import { gameStore } from "../../game-data/observable-stores";
import getFontString from "../../fonts/get-font-string";

const baseTextStyle = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#ffffff"
};
const dimTextStyle = Object.assign({}, baseTextStyle, { fill: "#ffffff" });
const numDigits = 7;

export default class Score {
  constructor(scene, hudContainer, enemies, combo, hudMessageDisplay) {
    this.score = this.roundedScore = 0;
    this.hasSetNewHighScore = false;

    const { width } = scene.sys.game.config;
    this.scoreText = scene.add.text(width - 5, 5, "0", baseTextStyle).setOrigin(1, 0);
    hudContainer.add(this.scoreText);

    this.zeroPadText = scene.add
      .text(-this.scoreText.width, 5, "", dimTextStyle)
      .setOrigin(1, 0)
      .setAlpha(0.5);
    hudContainer.add(this.zeroPadText);

    this.hudMessageDisplay = hudMessageDisplay;

    // enemies.onEnemyKilled.add(() => this.incrementScore(combo.getCombo()));

    this.setScore(this.roundedScore);
  }

  incrementScore(delta) {
    this.setScore(this.score + delta);
  }

  getScore() {
    return this.roundedScore;
  }

  setScore(newScore) {
    this.score = newScore;
    this.roundedScore = Math.round(this.score);
    gameStore.setScore(this.roundedScore);
    this.updateDisplay();
    if (!this.hasSetNewHighScore && this.roundedScore > gameStore.highScore) {
      this.hasSetNewHighScore = true;
      this.hudMessageDisplay.setMessage("New high score!");
    }
  }

  updateDisplay() {
    const stringScore = String(this.roundedScore);
    const paddedScore =
      stringScore.length <= numDigits ? "0".repeat(numDigits - stringScore.length) : "";
    this.scoreText.setText(stringScore);
    this.zeroPadText.x = this.scoreText.x - this.scoreText.width;
    this.zeroPadText.setText(paddedScore);
  }
}
