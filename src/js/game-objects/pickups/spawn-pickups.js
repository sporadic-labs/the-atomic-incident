module.exports = SpawnPickups;

var WeaponPickup = require("./weapon-pickup.js");

SpawnPickups.prototype = Object.create(Phaser.Group.prototype);

function SpawnPickups(game) {
    this.game = game;
    var pickups = game.globals.groups.pickups;
    Phaser.Group.call(this, game, pickups, "weapon-pickups");

    this._map = game.globals.tileMap;
    this._player = game.globals.player;
    this._pickups = pickups;
    this._scorekeeper = game.globals.scoreKeeper;

    this.weaponTypes = [
        "rusty-sword",
        "weapon-scattershot",
        "weapon-flamethrower",
        "weapon-machine-gun",
        "weapon-laser",
        "weapon-beam",
        "weapon-arrow",
        "grenade",
        "rocket",
        "weapon-slug",
    ];
}

SpawnPickups.prototype.spawn = function (x, y) {
    if ((this._scorekeeper.getScore() % 20) === 0) {
        var num = this.game.rnd.integerInRange(0, this.weaponTypes.length-1);
        new WeaponPickup(this.game, x, y, this.weaponTypes[num]);
    }
};

SpawnPickups.prototype.destroy = function () {
    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};
