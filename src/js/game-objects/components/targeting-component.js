// MH: if we end up using a component pattern often, we may want to create a 
// BaseComponent class that enforces that components have the standard lifecycle
// methods of update/destroy/etc.

module.exports = TargetingComponent;

function TargetingComponent(parent, maxSpeed) {
    this.game = parent.game;
    this.parent = parent;
    this.target = null;
    this._maxSpeed = maxSpeed;
    this._visionRadius = 1200;

    this._findTarget();
}

TargetingComponent.prototype.update = function () {
    // Stop moving
    this.parent.body.velocity.set(0);
    
    // Update target
    if (!this.target || (this.target.health <= 0)) this._findTarget();

    var distance = this.parent.world.distance(this.target.position);
    if (distance > this._visionRadius) return this.target;
    
    // Calculate path
    var tilemapLayer = this.game.globals.tileMapLayer;
    var start = tilemapLayer.getTileXY(this.parent.x, this.parent.y, {});
    var goal = tilemapLayer.getTileXY(this.target.x, this.target.y, {});
    var path = this.game.globals.plugins.astar.findPath(start, goal);

    // If there is an a* path to the target, move to the next node in the path
    if (path.nodes.length) {
        var tileHeight = this.game.globals.tileMap.tileHeight;
        var tileWidth = this.game.globals.tileMap.tileWidth;
        var nextNode = path.nodes[path.nodes.length - 1];
        var nextTargetPoint = new Phaser.Point(
            nextNode.x * tileWidth + tileWidth / 2, 
            nextNode.y * tileHeight + tileHeight / 2
        );
        this._moveTowards(nextTargetPoint);
    }

    return this.target;
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
    var targetDistance = null;

    // Target the closest light
    lights.forEach(function (light) {
        var distance = this.parent.world.distance(light.position);
        if ((targetDistance === null) || distance < targetDistance) {
            this.target = light;
            targetDistance = distance;
        }
    }, this);

    // If there are no lights left, attack the player
    if (this.target === null) this.target = this.game.globals.player;
};

TargetingComponent.prototype.destroy = function () {
    // Nothing special to destroy
};