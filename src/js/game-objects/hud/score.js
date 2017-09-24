import { gameStore } from "../../game-data/observable-stores";
import { autorun } from "mobx";

const baseTextStyle = { font: "30px 'Alfa Slab One'", fill: "#ffd800" };
const dimTextStyle = Object.assign({}, baseTextStyle, { fill: "#a0976a" });

/**
 * Listens to the gameStore and updates the score UI. Anchored from (1, 0)
 * 
 * @export
 * @class Score
 * @extends {Phaser.Group}
 */
export default class Score extends Phaser.Group {
  constructor(game, parent) {
    super(game, parent, "score");

    this._scoreText = game.make.text(0, 0, "0", baseTextStyle);
    this._scoreText.anchor.setTo(1, 0);
    this.add(this._scoreText);

    this._scorePadText = game.make.text(-this._scoreText.width, 0, "", dimTextStyle);
    this._scorePadText.anchor.setTo(1, 0);
    this.add(this._scorePadText);

    gameStore.setScore(0);
    this._scoreUnsubscribe = autorun(() => {
      this._updateDisplay(gameStore.score);
    });
  }

  _updateDisplay(score) {
    this._scoreText.setText(score);

    this._scorePadText.x = this._scoreText.x - this._scoreText.width;
    const scoreDigits = String(score).length;
    const padText = scoreDigits <= 6 ? "0".repeat(6 - scoreDigits) : "";
    this._scorePadText.setText(padText);
  }

  destroy(...args) {
    this._scoreUnsubscribe();
    super.destroy(...args);
  }
}
