module.exports = Wave1;

var SeekerGroup = require("../enemies/seeker-group.js");
var utils = require("../../helpers/utilities.js");

Wave1.prototype = Object.create(Phaser.Group.prototype);

function Wave1(game, spawnDelay, spawnActivationDelay) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "wave-1");

    this._player = this.game.globals.player;
    this._enemiesGroup = enemies;
    this._nonCollidingGroup = this.game.globals.groups.nonCollidingGroup;
    this._spawnDelay = utils.default(spawnDelay, 6000);
    this._spawnActivationDelay = utils.default(spawnActivationDelay, 500);

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._spawn();
}

Wave1.prototype._spawn = function () {
    var newGroup = new SeekerGroup(this.game, 5);

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