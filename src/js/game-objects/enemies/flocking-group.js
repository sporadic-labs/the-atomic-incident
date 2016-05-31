module.exports = FlockingGroup;

var BaseEnemy = require("./base-enemy.js");


// -- FLOCKING GROUP -----------------------------------------------------------

FlockingGroup.prototype = Object.create(Phaser.Group.prototype);
FlockingGroup.prototype.constructor = FlockingGroup;

function FlockingGroup(game, numToSpawn, x, y, enemiesGroup, target, 
    scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "flocking-group");
    // Group is positioned at (0, 0) to make coordinate system between groups
    // match. This could be changed later.

    var randSpread = 250;
    for (var i = 0; i < numToSpawn; i += 1) {
        var enemyX = x + game.rnd.realInRange(-randSpread, randSpread);        
        var enemyY = y + game.rnd.realInRange(-randSpread, randSpread);
        new FlockingEnemy(game, enemyX, enemyY, this, i, target, scoreSignal);
    }

    this._distances = {};
    this._calculateDistances();
}

FlockingGroup.prototype.countNeighborsInRange = function (enemy, range) {
    var numInRange = 0;
    for (var i = 0; i < this.children.length; i += 1) {
        var otherEnemy = this.children[i];
        var key = this._getDistanceKey(enemy, otherEnemy);
        var distance = this._distances[key];
        if (distance <= range) numInRange += 1;
    }
    return numInRange;
};

FlockingGroup.prototype.getNearestCentroid = function (enemy, numEnemies) {
    var distances = [];
    for (var i = 0; i < this.children.length; i += 1) {
        var otherEnemy = this.children[i];
        if (otherEnemy.getId() !== enemy.getId()) {
            var key = this._getDistanceKey(enemy, otherEnemy);
            var distance = this._distances[key];
            distances.push({
                position: otherEnemy.position, 
                distance: distance
            });
        }
    }
    distances.sort(function (a, b) {
        if (a.distance < b.distance) return -1;
        else if (a.distance > b.distance) return 1;
        else return 0;
    });
    var centroid = new Phaser.Point(0, 0);
    var numEnemies = Math.min(this.children.length, numEnemies);
    for (var i = 0; i < numEnemies; i += 1) {
        // centroid.add(distances[i].position); <- Broken
        centroid.x += distances[i].position.x;
        centroid.y += distances[i].position.y;
    }
    centroid.divide(numEnemies, numEnemies);
    return centroid;
};

FlockingGroup.prototype._calculateDistances = function () {
    this._distances = {};
    for (var i = 0; i < this.children.length; i += 1) {
        var enemy1 = this.children[i];
        for (var j = i + 1; j < this.children.length; j += 1) {
            var enemy2 = this.children[j];
            var d = enemy1.position.distance(enemy2.position);
            var key = this._getDistanceKey(enemy1, enemy2);
            this._distances[key] = d;
        }
    }
};

FlockingGroup.prototype._getDistanceKey = function (enemy1, enemy2) {
    var id1 = enemy1.getId();
    var id2 = enemy2.getId();
    if (id1 < id2) {
        return id1 + "->" + id2;
    } else {
        return id2 + "->" + id1;
    }
};

FlockingGroup.prototype.update = function () {
    this._calculateDistances();
    Phaser.Group.prototype.update.call(this);
};


// -- FLOCKING INDIVIDUAL ------------------------------------------------------

FlockingEnemy.prototype = Object.create(BaseEnemy.prototype);
FlockingEnemy.prototype.constructor = FlockingEnemy;

function FlockingEnemy(game, x, y, parentGroup, id, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        target, scoreSignal, 1);
    
    this._applyRandomLightnessTint(280/360, 1.0, 0.6);

    this._id = id;
    this._flockingRadius = 100;
    this._flockingThreshold = 10;
}

FlockingEnemy.prototype.getId = function () {
    return this._id;
};

/**
 * Override preUpdate to update velocity. Physics updates happen in preUpdate,
 * so if the velocity updates happened AFTER that, the targeting would be off
 * by a frame.
 */
FlockingEnemy.prototype.preUpdate = function () {
    this.body.velocity.set(0);

    var numNeighbors = this.parent.countNeighborsInRange(this, 
        this._flockingRadius);
    if (numNeighbors >= this._flockingThreshold) {
        // Enemy is safely in a flock - head towards target
        var distance = this.position.distance(this._target.position);
        var angle = this.position.angle(this._target.position);
        var targetSpeed = distance / this.game.time.physicsElapsed;
        var magnitude = Math.min(this._maxSpeed, targetSpeed);
        this.body.velocity.x = magnitude * Math.cos(angle);
        this.body.velocity.y = magnitude * Math.sin(angle);
    }
    else {
        // Enemy is not in a flock - head towards the centroid of closest 
        // neighbors
        var centroid = this.parent.getNearestCentroid(this, 
            this._flockingThreshold);
        var distance = this.position.distance(centroid);
        var angle = this.position.angle(centroid);
        var targetSpeed = distance / this.game.time.physicsElapsed;
        var magnitude = Math.min(this._maxSpeed, targetSpeed);
        this.body.velocity.x = magnitude * Math.cos(angle);
        this.body.velocity.y = magnitude * Math.sin(angle);
    }

    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.call(this);
};
