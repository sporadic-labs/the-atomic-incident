// MH: if we end up using a component pattern often, we may want to create a 
// BaseComponent class that enforces that components have the standard lifecycle
// methods of update/destroy/etc.

var DestructableLight = require("../destructable-light.js");

module.exports = TargetingComponent;

function TargetingComponent(parent, maxSpeed, visionDistance, path) {
    this.game = parent.game;
    this.parent = parent;
    this.target = null;
    this._maxSpeed = maxSpeed;
    this._visionDistance = visionDistance || 100;
    this._player = this.game.globals.player;

    var lightTarget = this._findClosestLight();
    this._switchTarget(lightTarget);
}

TargetingComponent.prototype.update = function () {
    // Stop moving
    this.parent.body.velocity.set(0);

    // Update the target to be the player or a light
    var distToPlayer = this._player.position.distance(this.parent.position);
    if (distToPlayer <= this._visionDistance) {
        // Player is in range, switch to targeting player
        this._switchTarget(this._player)
    } else {
        // If player is not in range and the target was previously the player,
        // target a light
        var wasTargetingPlayer = (this.target === this._player);
        var isTargetDead = (this.target && this.target.health <= 0);
        if (!this.target || wasTargetingPlayer || isTargetDead) {
            var lightTarget = this._findClosestLight();
            this._switchTarget(lightTarget);
        }
    }

    // Update the path to the target when needed
    if (this.target) {
        var hasMoved = !this._lastTargetPosition.equals(this.target.position);
        if (hasMoved || this._path === null) this._recalculatePath();
        
        // If there is an a* path to the target, move to the next node
        if (this._path) {
            this._updateTargetPathNode();
            this._moveTowards(this._path.getCurrentPoint());
        }
    }
    return this.target;
};

TargetingComponent.prototype._recalculatePath = function () {
    // Calculate path
    var tilemapLayer = this.game.globals.tileMapLayer;
    var tileHeight = this.game.globals.tileMap.tileHeight;
    var tileWidth = this.game.globals.tileMap.tileWidth;
    var start = tilemapLayer.getTileXY(this.parent.x, this.parent.y, {});
    var goal = tilemapLayer.getTileXY(this.target.x, this.target.y, {});
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
        this._path = new Path(pointsArray);
    }
};

TargetingComponent.prototype._updateTargetPathNode = function () {
    if (!this._path) return;
    var pos = this.parent.world;
    // If there is no target node or the parent is within a fudge factor of the
    // current target node, then update the target
    var targetNode = this._path.getCurrentPoint();
    if (pos.distance(targetNode) < 5) this._path.advancePoint();
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
    this._path = null;
    this._targetPathNode = null;
    if (target) this._lastTargetPosition = this.target.position.clone();
};

TargetingComponent.prototype._findClosestLight = function () {
    var lights = this.game.globals.groups.lights;
    var targetDistance = null;
    var closestLight = null;

    // Target the closest light
    lights.forEach(function (light) {
        // Check if light is the "base" light that enemies should be targeting
        if (light instanceof DestructableLight) {
            var distance = this.parent.world.distance(light.position);
            if ((targetDistance === null) || distance < targetDistance) {
                closestLight = light;
                targetDistance = distance;
            }
        }
    }, this);
    
    return closestLight;
};

TargetingComponent.prototype.destroy = function () {
    // Nothing special to destroy
};

/**
 * A light weight class for representing a path that an agent can travel along 
 * 
 * @param {Phaser.Point[]} points Array of points that make up the path
 */
function Path(points) {
    this._points = points;
    this._position = 0;
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