module.exports = Wave1;

var SpiralGroup = require("../enemies/spiral-group.js");
var WallGroup = require("../enemies/wall-group.js");
var SineGroup = require("../enemies/sine-wave-group.js");
var SpawnerGroup = require("../enemies/spawner-group.js");
var utils = require("../../helpers/utilities.js");

Wave1.prototype = Object.create(Phaser.Group.prototype);
Wave1.prototype.constructor = Wave1;

function Wave1(game, parentGroup, player, scoreSignal, spawnDelay) {
    Phaser.Group.call(this, game, parentGroup, "wave-1");

    this._player = player;
    this._scoreSignal = scoreSignal;
    this._spawnDelay = utils.default(spawnDelay, 3000);

    this._spawnTimer = this.game.time.create(false);
    this._spawnTimer.start();

    this._spawn();
}

Wave1.prototype._spawn = function () {
    var r = this.game.rnd.between(0, 3);
    if (r === 0) {
        new SpiralGroup(this.game, 15, this._player.x, this._player.y,
            this, this._player, this._scoreSignal);
    } else if (r === 1) {
        new WallGroup(this.game, 15, this, this._player, this._scoreSignal);        
    } else if (r === 2) {
        new SineGroup(this.game, 45, this, this._player, this._scoreSignal);
    } else if (r === 3) {
        new SpawnerGroup(this.game, 5, this, this._player, this._scoreSignal);
    }

    // Schedule next spawn
    this._spawnTimer.add(this._spawnDelay, this._spawn.bind(this));
};

Wave1.prototype.destroy = function () {
    this._spawnTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};