module.exports = Wave1;

var SpiralGroup = require("../enemies/spiral-group.js");
var WallGroup = require("../enemies/wall-group.js");
var SineGroup = require("../enemies/sine-wave-group.js");
var SpawnerGroup = require("../enemies/spawner-group.js");
var utils = require("../../helpers/utilities.js");

Wave1.prototype = Object.create(Phaser.Group.prototype);
Wave1.prototype.constructor = Wave1;

function Wave1(game, enemyGroup, nonCollidingGroup, player, scoreSignal, 
    spawnDelay, spawnActivationDelay) {
    Phaser.Group.call(this, game, enemyGroup, "wave-1");

    this._player = player;
    this._scoreSignal = scoreSignal;
    this._nonCollidingGroup = nonCollidingGroup;
    this._enemyGroup = enemyGroup;
    this._spawnDelay = utils.default(spawnDelay, 3000);
    this._spawnActivationDelay = utils.default(spawnActivationDelay, 500);

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._spawn();
}

Wave1.prototype._spawn = function () {
    // Generate a random group
    var rand = this.game.rnd.between(0, 3);
    var newGroup;
    switch (rand) {
        case 0:
            newGroup = new SpiralGroup(this.game, 15, this._player.x, 
                this._player.y, this, this._player, this._scoreSignal);
            break;
        case 1:
            newGroup = new WallGroup(this.game, 15, this, this._player, 
                this._scoreSignal);
            break;
        case 2:
            newGroup = new SineGroup(this.game, 45, this, this._player, 
                this._scoreSignal);
            break;
        case 3:
            newGroup = new SpawnerGroup(this.game, 5, this, this._player,
                this._scoreSignal);
            break;
    }

    // Control how it gets added to the wave - delayed activation
    this._scheduleGroupActivation(newGroup);

    // Schedule next spawn
    this._timer.add(this._spawnDelay, this._spawn.bind(this));
};

Wave1.prototype._scheduleGroupActivation = function (group) {
    // Move the group to the non-colliding group
    this._nonCollidingGroup.add(group);
    // Tween it's transparency to give the player a single that the group is 
    // spawning
    group.alpha = 0.25;
    var tween = this.game.make.tween(group)
        .to({ alpha: 1 }, this._spawnActivationDelay, "Quad.easeInOut", true);
    // Schedule the activation
    this._timer.add(this._spawnActivationDelay, function () {
        // To be safe, check if the group has been destroyed
        if (!group.game) return; 
        // To be safe, stop the tween
        tween.stop();
        group.alpha = 1;
        // Move the group to the colliding wave group
        this.add(group);
    }, this);
};

Wave1.prototype.destroy = function () {
    this._timer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Group.prototype.destroy.apply(this, arguments);
};