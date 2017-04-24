// MH: if we end up using a component pattern often, we may want to create a 
// BaseComponent class that enforces that components have the standard lifecycle
// methods of update/destroy/etc.

module.exports = TargetingComponent;

function TargetingComponent(parent, maxSpeed) {
    this.game = parent.game;
    this.parent = parent;
    this._maxSpeed = maxSpeed;
    this.target = this.game.globals.player;
    this._levelManager = this.game.globals.levelManager;
}

TargetingComponent.prototype.update = function () {
    // Stop moving
    this.parent.body.velocity.set(0);

    // Calculate path
    const easyStar = this.game.globals.plugins.easyStar;
    const path = easyStar.getWorldPath(this.parent.position, this.target.position);
    
    // Check if there is a path that was found
    if (path) {
        if (path.length > 1) {
            // If there are multiple steps in the path, head towards the second
            // point. This allows the sprite to skip the tile it is currently in.
            var nextNode = path[1];
            var nextTargetPoint = new Phaser.Point(nextNode.x, nextNode.y);
            this._moveTowards(nextTargetPoint);
        } else {
            // If there aren't multiple steps, sprite is close enough to directly head
            // for the target itself
            this._moveTowards(this.target.position);
        }
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

TargetingComponent.prototype.destroy = function () {
    // Nothing special to destroy
};