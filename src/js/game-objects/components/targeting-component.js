// MH: if we end up using a component pattern often, we may want to create a 
// BaseComponent class that enforces that components have the standard lifecycle
// methods of update/destroy/etc.

var DestructableLight = require("../destructable-light.js");

module.exports = TargetingComponent;

function TargetingComponent(parent, maxSpeed) {
    this.game = parent.game;
    this.parent = parent;
    this.target = null;
    this._maxSpeed = maxSpeed;
    this._visionRadius = 1200;

    this._lastTargetPosition = null;
    this._path = null;
    this._targetPathNode = null;
    this._findTarget();
}

TargetingComponent.prototype.update = function () {
    // Stop moving
    this.parent.body.velocity.set(0);
    
    // Update target
    if (!this.target || (this.target.health <= 0)) this._findTarget();

    // var distance = this.parent.world.distance(this.target.position);
    // if (distance > this._visionRadius) return this.target;

    // Update the astar path only when needed
    var hasTargetMoved = !this._lastTargetPosition.equals(this.target.position);
    if (hasTargetMoved || this._path === null) this._recalculatePath();
    
    // If there is an a* path to the target, move to the next node in the path
    if (this._path) {
        this._updateTargetPathNode();
        this._moveTowards(this._targetPathNode);
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

TargetingComponent.prototype._findTarget = function () {
    var lights = this.game.globals.groups.lights;

    // Reset the target and distance
    this.target = null;
    this._path = null;
    var targetDistance = null;

    // Target the closest light
    lights.forEach(function (light) {
        // Check if light is the "base" light that enemies should be targeting
        if (light instanceof DestructableLight) {
            var distance = this.parent.world.distance(light.position);
            if ((targetDistance === null) || distance < targetDistance) {
                this.target = light;
                targetDistance = distance;
            }
        }
    }, this);

    // If there are no lights left, attack the player
    if (this.target === null) this.target = this.game.globals.player;

    this._lastTargetPosition = this.target.position.clone();
};

TargetingComponent.prototype.destroy = function () {
    // Nothing special to destroy
};