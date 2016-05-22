/**
 * GameState - this is the main level for now
 */

module.exports = GameState;

var Player = require("../game-objects/player.js");
var Seeker = require("../game-objects/seeker-enemy.js");

function GameState(game) {
    this.reticule = null;
}

GameState.prototype.create = function () {
    this.stage.backgroundColor = "#AAA000";
    this.world.resize(2000, 2000);

    // Physics
    this.physics.startSystem(Phaser.Physics.ARCADE);
    this.physics.arcade.gravity.y = 0;
    this.physics.arcade.gravity.x = 0;

    this.stage.backgroundColor = "#F9F9F9";

    var tileSprite = this.add.tileSprite(0, 0, 2000, 2000, "assets", "grid");

    this.reticule = this.add.sprite(this.input.mousePointer.x, this.input.mousePointer.y, "assets", "reticule");
    this.reticule.anchor.set(0.5, 0.5);

    var player = new Player(this.game, this.world.centerX, this.world.centerY);
    this.camera.follow(player);

    for (var i = 0; i < 300; i += 1) {
        var seeker = new Seeker(this.game, this.world.randomX, 
            this.world.randomY, player);
    }
};

GameState.prototype.update = function () {
    this.reticule.position.x = this.camera.x + this.input.mousePointer.x;
    this.reticule.position.y = this.camera.y + this.input.mousePointer.y;

};

