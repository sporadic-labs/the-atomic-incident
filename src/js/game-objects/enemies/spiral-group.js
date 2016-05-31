module.exports = SpiralGroup;

var BaseEnemy = require("./base-enemy.js");


// -- FLOCKING GROUP -----------------------------------------------------------

SpiralGroup.prototype = Object.create(Phaser.Group.prototype);
SpiralGroup.prototype.constructor = SpiralGroup;

function SpiralGroup(game, numToSpawn, x, y, enemiesGroup, target, 
    scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "flocking-group");
    // Group is positioned at (0, 0) to make coordinate system between groups
    // match. This could be changed later.

    var radius = 300;    
    for (var i = 0; i < numToSpawn; i += 1) {
        var angle = (i / numToSpawn) * (2 * Math.PI);
        var enemyX = x + (radius * Math.cos(angle));        
        var enemyY = y + (radius * Math.sin(angle));        
        new SpiralEnemy(game, enemyX, enemyY, this, i, target, scoreSignal);
    }
}


// -- FLOCKING INDIVIDUAL ------------------------------------------------------

SpiralEnemy.prototype = Object.create(BaseEnemy.prototype);
SpiralEnemy.prototype.constructor = SpiralEnemy;

function SpiralEnemy(game, x, y, parentGroup, id, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        target, scoreSignal, 1);
    
    this._applyRandomLightnessTint(280/360, 1.0, 0.6);

    this._id = id;
    this._flockingRadius = 100;
    this._flockingThreshold = 10;

}

SpiralEnemy.prototype.getId = function () {
    return this._id;
};

/**
 * Override preUpdate to update velocity. Physics updates happen in preUpdate,
 * so if the velocity updates happened AFTER that, the targeting would be off
 * by a frame.
 */
SpiralEnemy.prototype.preUpdate = function () {
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
