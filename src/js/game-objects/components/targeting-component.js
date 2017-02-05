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
            this._moveTowards(this._targetPathNode);
        }
    }
    return this.target;
};

TargetingComponent.prototype._recalculatePath = function () {
    // Calculate path
    var tilemapLayer = this.game.globals.tileMapLayer;
    var start = tilemapLayer.getTileXY(this.parent.x, this.parent.y, {});
    var goal = tilemapLayer.getTileXY(this.target.x, this.target.y, {});
    var path = this.game.globals.plugins.astar.findPath(start, goal);
    this._path = path.nodes.length ? path : null; 
    this._targetPathNode = null;
};

TargetingComponent.prototype._updateTargetPathNode = function () {
    if (!this._path) return;
    var pos = this.parent.world;
    // If there is no target node or the parent is within a fudge factor of the
    // current target node, then update the target
    if (!this._targetPathNode || pos.distance(this._targetPathNode) < 5) {
        // If there is a node left in the path, pop it off of the path
        if (this._path.nodes.length > 0) {
            var nextNode = this._path.nodes.pop();
            var tileHeight = this.game.globals.tileMap.tileHeight;
            var tileWidth = this.game.globals.tileMap.tileWidth;
            this._targetPathNode = new Phaser.Point(
                nextNode.x * tileWidth + tileWidth / 2, 
                nextNode.y * tileHeight + tileHeight / 2
            );
        }
    }
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