module.exports = WaveType;

var utils = require("../../helpers/utilities.js");

function WaveType(game, name, numAttackers, numBombers) {
    this.game = game;
    this.name = name;
    this.numBombers = numBombers || 0;
    this.numAttackers = numAttackers || 0;
    this.totalEnemies = this.numBombers + this.numAttackers;
    this._enemies = [];
}

WaveType.prototype.startNewSpawn = function () {
    this._enemies = [];
    var i;
    for (i = 0; i < this.numBombers; i++) this._enemies.push("bomber");
    for (i = 0; i < this.numAttackers; i++) this._enemies.push("attacker");
    utils.shuffleArray(this._enemies);
};

WaveType.prototype.getNextEnemyType = function () {
    if (this._enemies.length === 0) return false;
    else return this._enemies.pop();
};