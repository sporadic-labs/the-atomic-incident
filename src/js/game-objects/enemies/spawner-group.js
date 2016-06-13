module.exports = SpawnerGroup;

var BaseEnemy = require("./base-enemy.js");
var utils = require("../../helpers/utilities.js");


// -- GROUP --------------------------------------------------------------------

SpawnerGroup.prototype = Object.create(Phaser.Group.prototype);
SpawnerGroup.prototype.constructor = SpawnerGroup;

function SpawnerGroup(game, numToSpawn, enemiesGroup, player, scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "spawner-group");

    this._player = player;

    // Parameters for randomly placing spawners
    var left = this._player.x - (this.game.camera.width / 2);
    var right = this._player.x + (this.game.camera.width / 2);
    var top = this._player.y - (this.game.camera.height / 2);
    var bottom = this._player.y + (this.game.camera.height / 2);
    var playerRadius = 100;

    for (var i = 0; i < numToSpawn; i += 1) {
        var point, playerDist;
        do {
            point = new Phaser.Point(
                this.game.rnd.between(left, right),
                this.game.rnd.between(top, bottom)
            );
            playerDist = this._player.position.distance(point);
        } while (playerDist < playerRadius);
        new SpawnerEnemy(game, point.x, point.y, this, this._player, 
            scoreSignal);
    }
}

// -- SPAWNER INDIVIDUAL -------------------------------------------------------

SpawnerEnemy.prototype = Object.create(BaseEnemy.prototype);
SpawnerEnemy.prototype.constructor = SpawnerEnemy;

function SpawnerEnemy(game, x, y, parentGroup, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        target, scoreSignal, 1);
    
    this.scale.set(1.2);
    this._spawnCooldown = 3000;

    this._applyRandomLightnessTint(320/360, 1.0, 0.3);

    this._timer = this.game.time.create(false);
    this._timer.start();

    // Schedule first spawn
    this._timer.add(1000, this._spawn, this);
}

SpawnerEnemy.prototype._spawn = function () {
    new SeekerEnemy(this.game, this.x, this.y, this.parent, this._target, 
        this._scoreSignal);
    this._timer.add(this._spawnCooldown, this._spawn, this);
};

SpawnerEnemy.prototype.destroy = function () {
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.call(this, arguments);
};


// -- SEEKER INDIVIDUAL --------------------------------------------------------

SeekerEnemy.prototype = Object.create(BaseEnemy.prototype);
SeekerEnemy.prototype.constructor = SeekerEnemy;

function SeekerEnemy(game, x, y, parentGroup, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        target, scoreSignal, 1);

    this.scale.set(0.8);
    
    this._applyRandomLightnessTint(320/360, 1.0, 0.6);
    this._maxSpeed = 100;
}

/**
 * Override preUpdate to update velocity. Physics updates happen in preUpdate,
 * so if the velocity updates happened AFTER that, the targeting would be off
 * by a frame.
 */
SeekerEnemy.prototype.preUpdate = function () {
    this.body.velocity.set(0);

    var distance = this.position.distance(this._target.position);
    var angle = this.position.angle(this._target.position);
    var targetSpeed = distance / this.game.time.physicsElapsed;
    var magnitude = Math.min(this._maxSpeed, targetSpeed);
    this.body.velocity.x = magnitude * Math.cos(angle);
    this.body.velocity.y = magnitude * Math.sin(angle);

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};
