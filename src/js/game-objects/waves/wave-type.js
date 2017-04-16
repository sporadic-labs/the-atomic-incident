module.exports = WaveType;

var utils = require("../../helpers/utilities.js");

function WaveType(game, name, pattern, redNum, greenNum, blueNum) {
    this.game = game;
    this.name = name;
    this.pattern = pattern;
    this.redNum = redNum || 0;
    this.greenNum = greenNum || 0;
    this.blueNum = blueNum || 0;
    this.totalEnemies = this.redNum + this.greenNum + this.blueNum;
    this._enemies = [];
}

WaveType.prototype.startNewSpawn = function () {
    this._enemies = [];
    var i;
    for (i = 0; i < this.redNum; i++) this._enemies.push("red");
    for (i = 0; i < this.greenNum; i++) this._enemies.push("green");
    for (i = 0; i < this.blueNum; i++) this._enemies.push("blue");
    utils.shuffleArray(this._enemies);
};

WaveType.prototype.getNextEnemyType = function () {
    if (this._enemies.length === 0) return false;
    else return this._enemies.pop();
};