/**
 * Keep track of the players current score.
 * 
 * @export
 * @class ScoreKeeper
 */
export default class ScoreKeeper {
  constructor(game) {
    this.game = game;
    this._score = 0;
  }

  /**
   * Add the provided value to the current Score.
   * 
   * @param {any} points 
   * @returns 
   * @memberof ScoreKeeper
   */
  incrementScore(points) {
    // If the point value isn't a number, or isn't defined, then bail!
    if (points === undefined || points === null || isNaN(points)) {
      return;
    }
    console.log("we doin this?");

    // If the point value is defined, add it to the score.
    this._score += points;
  }

  /**
   * Getter for the current Score.
   * 
   * @returns 
   * @memberof ScoreKeeper
   */
  getScore() {
    return this._score;
  }

  /**
   * Setter for the current Score.
   * 
   * @param {any} score 
   * @memberof ScoreKeeper
   */
  setScore(score) {
    this._score = score || 0;
  }
}
