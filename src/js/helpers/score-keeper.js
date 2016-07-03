module.exports = ScoreKeeper;

function ScoreKeeper(signal) {
	this._score = 0;
}

ScoreKeeper.prototype.incrementScore = function (points) {
    if (points === undefined) return;
    this._score += points;
};

ScoreKeeper.prototype.setScore = function (points) {
    this._score = points || 0;
};

ScoreKeeper.prototype.getScore = function () {
    return this._score;
};