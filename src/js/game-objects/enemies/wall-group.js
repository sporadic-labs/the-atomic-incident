module.exports = WallGroup;

var BaseEnemy = require("./base-enemy.js");
var utils = require("../../helpers/utilities.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");


// -- GROUP --------------------------------------------------------------------

var WALL_STATES = {
    CHARING: "charing",
    ATTACKING: "attacking",
};

WallGroup.prototype = Object.create(Phaser.Group.prototype);

function WallGroup(game, numToSpawn) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "wall-group");
    
    this._player = this.game.globals.player;
    this._wallLength = 350;
    this._radius = 250; // Distance from player
    this._state = WALL_STATES.CHARGING;
    this._speed = 350;
    this._attackCooldown = 1000;
    
    // Pick a random attack angle and find it's corresponding vector
    var attackAngle = this.game.rnd.realInRange(0, 2 * Math.PI);
    this._attackDirection = utils.pointFromAngle(attackAngle);
    
    // Place the group at the center of the wall. This is a set distance away
    // from the player in the direction opposite the attack vector.
    this.position.set( 
        this._player.x + (this._radius * -this._attackDirection.x),
        this._player.y + (this._radius * -this._attackDirection.y)
    );

    this._spawnWall(numToSpawn, attackAngle);

    // Schedule the first attack
    this._timer = this.game.time.create(false);
    this._timer.start();
    this._timer.add(this._attackCooldown, this._startAttack, this);
}

WallGroup.prototype._spawnWall = function (numToSpawn, attackAngle) {
    // Find the direction along which the enemies should be placed - the angle
    // perpendicular to the attack angle
    var wallDirection = this._attackDirection.clone().perp();

    // Calculate the starting point for placing the sprites, e.g. move half the
    // wall length in the opposite direction of the wall
    var startPoint = new Phaser.Point(
        -wallDirection.x * (this._wallLength / 2),
        -wallDirection.y * (this._wallLength / 2)
    );

    // Create wall enemies
    for (var i = 0; i < numToSpawn; i += 1) {
        // Find the location along the wall
        var fraction = (i / (numToSpawn - 1));
        var point = startPoint.clone().add(
            wallDirection.x * (fraction * this._wallLength),
            wallDirection.y * (fraction * this._wallLength)
        )  
        // Create the enemy
        var wallEnemy = new WallEnemy(this.game, point.x, point.y, this);
        // Set it's rotation so sprite is facing in the attack direction
        wallEnemy.rotation = attackAngle;
    }
};

WallGroup.prototype._startAttack = function() {
    this._state = WALL_STATES.ATTACKING;
    this._attackDestination = this.position.clone()
        .add(
            this._attackDirection.x * (2 * this._radius),
            this._attackDirection.y * (2 * this._radius)
        );
};

WallGroup.prototype._finishAttack = function() {
    this._state = WALL_STATES.CHARING;
    this._attackDirection.multiply(-1, -1);
    this._timer.add(this._attackCooldown, this._startAttack, this);
};

WallGroup.prototype.update = function() {
    var elapsedSeconds = this.game.time.physicsElapsed;
    var maxMoveDistance = this._speed * elapsedSeconds;

    if (this._state === WALL_STATES.ATTACKING) {
        var dist = this.position.distance(this._attackDestination);
        if (dist < maxMoveDistance) {
            this.position.copyFrom(this._attackDestination);
            this._finishAttack();
        } else {
            this.position.add(
                maxMoveDistance * this._attackDirection.x,
                maxMoveDistance * this._attackDirection.y                
            );
        }
    }

    Phaser.Group.prototype.update.apply(this, arguments);
};

WallGroup.prototype.destroy = function() {
    this._timer.destroy();
    Phaser.Group.prototype.destroy.apply(this, arguments);
};


// -- INDIVIDUAL ---------------------------------------------------------------

WallEnemy.prototype = Object.create(BaseEnemy.prototype);

function WallEnemy(game, x, y, parentGroup) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup);

    spriteUtils.applyRandomLightnessTint(this, 175/360, 1.0, 0.6);
}