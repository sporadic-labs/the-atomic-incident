module.exports = SpawnPickups;

var ScorePickup = require("./score-pickup.js");

SpawnPickups.prototype = Object.create(Phaser.Group.prototype);

function SpawnPickups(game) {
    this.game = game;
    var pickups = game.globals.groups.pickups;
    Phaser.Group.call(this, game, pickups, "score-pickups");

    this._map = game.globals.tileMap;
    this._player = game.globals.player;
    this._pickups = pickups;
    this._scorekeeper = game.globals.scoreKeeper;
}

SpawnPickups.prototype.spawn = function (x, y) {
    var dropRate = this.game.rnd.integerInRange(1, 3);
    if ((this._scorekeeper.getScore() % dropRate) === 0) {
        new ScorePickup(this.game, x, y);
    }
};

SpawnPickups.prototype.destroy = function () {
    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};
