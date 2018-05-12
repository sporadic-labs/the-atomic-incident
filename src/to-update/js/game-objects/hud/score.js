import { gameStore } from "../../game-data/observable-stores";
import getFontString from "../../fonts/get-font-string";

const baseTextStyle = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#ffffff"
};
const toastTextStyle = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#FFEB6E",
  align: "center"
};
const dimTextStyle = Object.assign({}, baseTextStyle, { fill: "#ffffff" });
const numDigits = 7;

/**
 * Listens to the gameStore and updates the score UI. Anchored from (1, 0)
 *
 * @export
 * @class Score
 * @extends {Phaser.Group}
 */
export default class Score extends Phaser.Group {
  constructor(game, parent, enemies, combo, hudMessageDisplay) {
    super(game, parent, "score");

    this._rawScore = this._score = 0;
    this._hasSetNewHighScore = false;

    this._scoreText = game.make.text(0, 0, "0", baseTextStyle);
    this._scoreText.anchor.setTo(1, 0);
    this.add(this._scoreText);

    this._scorePadText = game.make.text(-this._scoreText.width, 0, "", dimTextStyle);
    this._scorePadText.anchor.setTo(1, 0);
    this._scorePadText.alpha = 0.5;
    this.add(this._scorePadText);

    this._hudMessageDisplay = hudMessageDisplay;

    enemies.onEnemyKilled.add(() => this.incrementScore(combo.getCombo()));

    this._setScore(this._score);
  }

  incrementScore(delta) {
    this._setScore(this._rawScore + delta);
  }

  getScore() {
    return this._score;
  }

  _setScore(newScore) {
    this._rawScore = newScore;
    this._score = Math.round(this._rawScore);
    gameStore.setScore(this._score);
    this._updateDisplay();
    if (!this._hasSetNewHighScore && this._score > gameStore.highScore) {
      this._hasSetNewHighScore = true;
      this._hudMessageDisplay.setMessage("New high score!");
    }
  }

  _updateDisplay() {
    const stringScore = String(this._score);
    const paddedScore =
      stringScore.length <= numDigits ? "0".repeat(numDigits - stringScore.length) : "";
    this._scoreText.setText(stringScore);
    this._scorePadText.x = this._scoreText.x - this._scoreText.width;
    this._scorePadText.setText(paddedScore);
  }
}
