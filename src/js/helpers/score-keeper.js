module.exports = ScoreKeeper;

function ScoreKeeper(signal) {
	this._score = 0;
	this._signal = signal;

	this._signal.add(this.updateScore, this);
}

ScoreKeeper.prototype.updateScore = function (points) {
    if (points === undefined) return;
    this._score += points;
};

ScoreKeeper.prototype.getScore = function () {
    return this._score;
};