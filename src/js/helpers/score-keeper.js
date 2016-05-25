module.exports = ScoreKeeper;


function ScoreKeeper(game, parentGroup, signal) {
	// set initial this.score to 0, setup score text
	this.score = 0;
	this._signal = signal;

	this._signal.add(function() {
		this.score++;
	}, this);
}


