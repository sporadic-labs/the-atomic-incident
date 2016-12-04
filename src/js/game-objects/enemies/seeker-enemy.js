module.exports = SeekerEnemy;

var BaseEnemy = require("./base-enemy.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");

var ANIM_NAMES = {
    IDLE: "idle",
    MOVE: "move"
};

SeekerEnemy.prototype = Object.create(BaseEnemy.prototype);

function SeekerEnemy(game, x, y, parentGroup) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", 100,
        parentGroup);
    
    spriteUtils.applyRandomLightnessTint(this, 0.98, 1, 0.5);

    // Setup animations
    var idleFrames = Phaser.Animation.generateFrameNames("enemy01/idle-", 1, 4, 
        "", 2);
    var moveFrames = Phaser.Animation.generateFrameNames("enemy01/move-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.IDLE, idleFrames, 10, true);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.play(ANIM_NAMES.IDLE);

    // this._visionRadius = 300;
    // NOTE(rex): If the _visionRadius is -1, track the player wherever you are at on the page
    this._visionRadius = -1;
    this._maxSpeed = 100;
}

SeekerEnemy.prototype.update = function() {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    this.body.velocity.set(0);

    // Check if player is within visual range
    var distance = this.position.distance(this._player.position);
    if (distance <= this._visionRadius || this._visionRadius === -1) {

        var start = this.game.globals.tileMapLayer.getTileXY(this.x, this.y, 
            {});
        var goal = this.game.globals.tileMapLayer.getTileXY(this._player.x,
            this._player.y, {});

        var path = this.game.globals.plugins.astar.findPath(start, goal);

        // If there is an a* path to the player, move to the next node in the 
        // path
        if (path.nodes.length) {
            var tileHeight = this.game.globals.tileMap.tileHeight;
            var tileWidth = this.game.globals.tileMap.tileWidth;
            var nextNode = path.nodes[path.nodes.length - 1];
            var target = new Phaser.Point(
                nextNode.x * tileWidth + tileWidth / 2, 
                nextNode.y * tileHeight + tileHeight / 2
            );
            this.moveTowards(target);
        }
    }    

    // Check whether enemy is moving, update its animation
    var isIdle;
    if (this.body.velocity.x === 0 && this.body.velocity.y === 0) {
        isIdle = true;
    } else {
        isIdle = false;
    }

    if (isIdle && this.animations.name !== ANIM_NAMES.IDLE) {
        this.animations.play(ANIM_NAMES.IDLE);
    } else if (!isIdle && this.animations.name !== ANIM_NAMES.MOVE) {
        this.animations.play(ANIM_NAMES.MOVE);
    }
};

SeekerEnemy.prototype.moveTowards = function(target) {
    // Check if target is within visual range
    var distance = this.position.distance(target);
    // If target is in range, calculate the acceleration based on the 
    // direction this sprite needs to travel to hit the target
    var angle = this.position.angle(target);
    var targetSpeed = distance / this.game.time.physicsElapsed;
    var magnitude = Math.min(this._maxSpeed, targetSpeed);
    this.body.velocity.x = magnitude * Math.cos(angle);
    this.body.velocity.y = magnitude * Math.sin(angle);
};


