module.exports = Wave1;

Wave1.prototype = Object.create(Phaser.Group.prototype);
Wave1.prototype.constructor = Wave1;

function Wave1(game, parentGroup, player, enemies) {
    Phaser.Group.call(game, parentGroup, "wave-1");
    this._player = player;
    this._enemies = enemies;
}

