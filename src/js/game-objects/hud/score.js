import { gameStore } from "../../game-data/observable-stores";

const baseTextStyle = { font: "30px 'Alfa Slab One'", fill: "#ffd800" };
const toastTextStyle = { font: "24px 'Alfa Slab One'", fill: "#ffd800", align: "center" };
const dimTextStyle = Object.assign({}, baseTextStyle, { fill: "#a0976a" });

/**
 * Listens to the gameStore and updates the score UI. Anchored from (1, 0)
 *
 * @export
 * @class Score
 * @extends {Phaser.Group}
 */
export default class Score extends Phaser.Group {
  constructor(game, parent, enemies, combo) {
    super(game, parent, "score");

    this._rawScore = this._score = 0;
    this._hasSetNewHighScore = false;

    this._scoreText = game.make.text(0, 0, "0", baseTextStyle);
    this._scoreText.anchor.setTo(1, 0);
    this.add(this._scoreText);

    this._scorePadText = game.make.text(-this._scoreText.width, 0, "", dimTextStyle);
    this._scorePadText.anchor.setTo(1, 0);
    this.add(this._scorePadText);

    this._highScoreMsgText = game.make.text(-game.width / 2, 0, "New high score!", toastTextStyle);
    this._highScoreMsgText.anchor.setTo(0.5, 0);
    this._highScoreMsgText.visible = false;
    this.add(this._highScoreMsgText);

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
      this._onNewHighScore();
    }
  }

  _updateDisplay() {
    const stringScore = String(this._score);
    const paddedScore = stringScore.length <= 6 ? "0".repeat(6 - stringScore.length) : "";
    this._scoreText.setText(stringScore);
    this._scorePadText.x = this._scoreText.x - this._scoreText.width;
    this._scorePadText.setText(paddedScore);
  }

  _onNewHighScore() {
    this._highScoreMsgText.visible = true;
    const timer = this.game.time.create(true);
    timer.add(3000, () => (this._highScoreMsgText.visible = false));
    timer.start();
    // TODO: Show some icon as well
  }
}
