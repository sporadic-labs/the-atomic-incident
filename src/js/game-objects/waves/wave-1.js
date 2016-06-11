module.exports = Wave1;

var SpiralGroup = require("../enemies/spiral-group.js");
var utils = require("../../helpers/utilities.js");

Wave1.prototype = Object.create(Phaser.Group.prototype);
Wave1.prototype.constructor = Wave1;

function Wave1(game, parentGroup, player, scoreSignal, spawnDelay) {
    Phaser.Group.call(this, game, parentGroup, "wave-1");

    utils.defaultProperties(this, {
        _player: { default: player },
        _scoreSignal: { default: scoreSignal },
        _spawnDelay: { value: spawnDelay, default: 3000 },
        _other: { value: undefined, default: "hi" }
    });

    this._spawnTimer = this.game.time.create(false);
    this._spawnTimer.start();

    this._spawn();
}

Wave1.prototype._spawn = function () {
    new SpiralGroup(this.game, 15, this._player.x, this._player.y,
        this, this._player, this._scoreSignal);

    // Schedule next spawn
    this._spawnTimer.add(this._spawnDelay, this._spawn.bind(this));
};

Wave1.prototype.destroy = function () {
    this._spawnTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};