// MH: if we end up using a component pattern often, we may want to create a 
// BaseComponent class that enforces that components have the standard lifecycle
// methods of update/destroy/etc.

module.exports = TargetingComponent;

function TargetingComponent(parent, maxSpeed, visionDistance, path) {
    this.game = parent.game;
    this.parent = parent;
    this.target = null;
    this._maxSpeed = maxSpeed;
    this._visionDistance = visionDistance || 100;
    this._player = this.game.globals.player;
    this._path = path;

    this._path = null;
    if (Array.isArray(path)) this._path = new Path(path);
}

TargetingComponent.prototype.update = function () {
    // Stop moving
    this.parent.body.velocity.set(0);

    var distToPlayer = this._player.position.distance(this.parent.position);
    var closestLight = this._findClosestLightInRange();

    if (distToPlayer <= this._visionDistance) this._switchTarget(this._player);
    else if (closestLight) this._switchTarget(closestLight);
    else {
        // Neither light or player is in range
        if (this.target || !this._path) {
            // If there was a target or the path is empty, pick a new path
            this.target = null;
            this._path = this._getClosestLevelPath();
        }
    }

    // Update the path to the target when needed
    if (this.target) {
        if (!this._lastTargetPosition.equals(this.target.position)) {
            this._path = this._getPathToPoint(this.target);
        }
    }
    
    // If there is a path, move to the next node
    if (this._path) {
        var targetNode = this._path.getCurrentPoint();
        // Fudge factor for advancing along the path
        if (this.parent.world.distance(targetNode) < 5) {
            this._path.advancePoint();
        }
        this._moveTowards(this._path.getCurrentPoint());
    }

    return this.target;
};

TargetingComponent.prototype._getClosestLevelPath = function () {
    var paths = this.game.globals.enemyPaths;
    var closestDistance = Infinity;
    var closestPath = null;
    var closestPointIndex = null;
    for (var i = 0; i < paths.length; i++) {
        var path = paths[i];
        for (var p = path.length - 1; p >= 0; p--) {
            var point = path[p];
            var distance = this.parent.world.distance(point);
            if (distance < closestDistance) {
                closestPath = path;
                closestPointIndex = p;
                closestDistance = distance;
            }
        }
    }
    return new Path(closestPath, closestPointIndex);
};

TargetingComponent.prototype._getPathToPoint = function (point) {
    // Calculate path
    var tilemapLayer = this.game.globals.tileMapLayer;
    var tileHeight = this.game.globals.tileMap.tileHeight;
    var tileWidth = this.game.globals.tileMap.tileWidth;
    var start = tilemapLayer.getTileXY(this.parent.x, this.parent.y, {});
    var goal = tilemapLayer.getTileXY(point.x, point.y, {});
    var path = this.game.globals.plugins.astar.findPath(start, goal);
    
    // Extract the array of points
    if (path.nodes.length) {
        // Astar gives the path in reverse order, so copy and reverse it
        var pathArray = path.nodes.reverse();
        // Astar gives tile coordinates, so construct an array of points in 
        // world coordinates
        var pointsArray = [];
        for (var i = 0; i < pathArray.length; i++) {
            pointsArray.push(new Phaser.Point(
                pathArray[i].x * tileWidth + tileWidth / 2, 
                pathArray[i].y * tileHeight + tileHeight / 2
            ));
        }
        // Construct a Path instance from the points
        return new Path(pointsArray);
    }

    return null;
};

TargetingComponent.prototype._moveTowards = function (position) {
    var distance = this.parent.position.distance(position);
    var angle = this.parent.position.angle(position);
    var targetSpeed = distance / this.game.time.physicsElapsed;
    var magnitude = Math.min(this._maxSpeed, targetSpeed);
    this.parent.body.velocity.x = magnitude * Math.cos(angle);
    this.parent.body.velocity.y = magnitude * Math.sin(angle);
};

TargetingComponent.prototype._switchTarget = function (target) {
    this.target = target;
    this._targetPathNode = null;
    if (target) {
        this._lastTargetPosition = this.target.position.clone();
        this._path = this._getPathToPoint(this.target);
    }
};

TargetingComponent.prototype._findClosestLightInRange = function () {
    // var lights = this.game.globals.groups.lights;
    // var closestDistance = Infinity;
    // var closestLight = null;

    // // Target the closest light
    // lights.forEach(function (light) {
    //     // Check if light is the "base" light that enemies should be targeting
    //     if (light instanceof DestructableLight) {
    //         // Skip dead lights
    //         if (light.health <= 0) return;
    //         // Check if light is in vision radius and is closer than previous
    //         var distance = this.parent.world.distance(light.position);
    //         if (distance < this._visionDistance && distance < closestDistance) {
    //             closestLight = light;
    //             closestDistance = distance;
    //         }
    //     }
    // }, this);
    
    // return closestLight;
};

TargetingComponent.prototype.destroy = function () {
    // Nothing special to destroy
};


/**
 * A light weight class for representing a path that an agent can travel along 
 * 
 * @param {Phaser.Point[]} points Array of points that make up the path
 * @param {number} [startingPosition=0] Index of starting position in the path
 */
function Path(points, startingPosition) {
    this._points = points;
    this._position = startingPosition || 0;
}

/**
 * Current point the agent should be heading towards. Should always return a 
 * valid point.
 * @returns {Phaser.Point}
 */
Path.prototype.getCurrentPoint = function () {
    return this._points[this._position];
};

/**
 * @returns {Phaser.Point} True if the path is empty
 */
Path.prototype.isEmpty = function () {
    return (this._points.length === 0);
};

/**
 * Advances along the path to the next point. Will not advance path the last
 * point.
 * @returns {this} For chaining purposes
 */
Path.prototype.advancePoint = function () {
    if ((this._position + 1) >= this._points.length) return;
    else this._position++;
    return this;
};

/**
 * Returns the last point in the path or null
 * @returns {Phaser.Point|null}
 */
Path.prototype.getFinalPoint = function () {
    if (!this.isEmpty()) return this._points[this.points.length - 1];
    return null;
};

/**
 * Returns the last point in the path or null
 * @returns {Phaser.Point|null}
 */
Path.prototype.isAtFinalPoint = function () {
    return ((this._position + 1) >= this._points.length);
};

/**
 * Constructs a shallow copy of the path (e.g. doesn't deep copy the _points 
 * array)
 * @returns {Path}
 */
Path.prototype.clone = function () {
    var newPath = new Path(this._points);
    newPath._position = this._position;
};