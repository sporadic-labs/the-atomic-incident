module.exports = SpawnPickups;

var WeaponPickup = require("./weapon-pickup.js");
var WEAPON_NAMES = require("../../constants/weapon-names.js");

SpawnPickups.prototype = Object.create(Phaser.Group.prototype);

function SpawnPickups(game) {
    this.game = game;
    var pickups = game.globals.groups.pickups;
    Phaser.Group.call(this, game, pickups, "weapon-pickups");

    this._map = game.globals.tileMap;
    this._player = game.globals.player;
    this._pickups = pickups;
    this._scorekeeper = game.globals.scoreKeeper;
}

SpawnPickups.prototype.spawn = function (x, y) {
    if ((this._scorekeeper.getScore() % 20) === 0) {
        var keys = Object.keys(WEAPON_NAMES);
        var key = this.game.rnd.pick(keys);
        new WeaponPickup(this.game, x, y, WEAPON_NAMES[key]);
    }
};

SpawnPickups.prototype.destroy = function () {
    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};
