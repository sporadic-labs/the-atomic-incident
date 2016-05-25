module.exports = ScoreKeeper;


function ScoreKeeper(game, parentGroup) {

	// set initial this.score to 0, setup score text
	this.score = 0;
	this.scoreText = this.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});


	// var signal = new Phaser.Signal();

	// // listener 1
	// signal.add(function () {
	//     console.log("listener 1");
	//     for (var i = 0; i < arguments.length; i++) {
	//         console.log("argument " + i + ": " + arguments[i]);
	//     }
	// }, this);
}

ScoreKeeper.prototype.update = function () {

};

ScoreKeeper.prototype._updateScore = function () {
	this.score++;
	this.scoreText.text = 'Score: ' + this.score;

};