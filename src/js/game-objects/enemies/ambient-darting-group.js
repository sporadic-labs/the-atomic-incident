// DOES NOT WORK

module.exports = AmbientDartingGroup;

var BaseEnemy = require("./base-enemy.js");


// -- GROUP --------------------------------------------------------------------

AmbientDartingGroup.prototype = Object.create(Phaser.Group.prototype);
AmbientDartingGroup.prototype.constructor = AmbientDartingGroup;

function AmbientDartingGroup(game, numToSpawn, enemiesGroup, player, 
    scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "flocking-group");
    // Group is positioned at (0, 0) to make coordinate system between groups
    // match. This could be changed later.
    
    this._rotationSpeed = Math.PI / 6; // rad / s
    this._radius = 300;
    this._player = player;
  
    for (var i = 0; i < numToSpawn; i += 1) {
        var angle = (i / numToSpawn) * (2 * Math.PI);
        var enemyX = player.x + (this._radius * Math.cos(angle));        
        var enemyY = player.y + (this._radius * Math.sin(angle));        
        new AmbientDarter(game, enemyX, enemyY, this, angle, this._radius, 
            this._rotationSpeed, player, scoreSignal);
    }
}

AmbientDartingGroup.prototype.update = function () {
    var numAttacking = 0;
    var indicesNotAttacking = [];
    for (var i = 0; i < this.children.length; i += 1) {
        var child = this.children[i];
        if (child.isAttacking()) numAttacking += 1;
        else indicesNotAttacking.push(i);        
    }

    if (numAttacking === 0) {
        var index = this.game.rnd.pick(indicesNotAttacking);
        var child = this.children[index];
        child.startAttack();
    }

    Phaser.Group.prototype.update.call(this);
};


// -- INDIVIDUAL ---------------------------------------------------------------

AmbientDarter.prototype = Object.create(BaseEnemy.prototype);
AmbientDarter.prototype.constructor = AmbientDarter;

var DARTER_STATES = {
    ROTATING: "rotating",
    CHARING: "charging",
    DARTING: "darting"
};

function AmbientDarter(game, x, y, parentGroup, angle, radius, rotationSpeed, 
    player, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy01/idle-01", parentGroup,
        player, scoreSignal, 1);

    this._player = player;
    this._angle = angle;
    this._radius = radius;
    this._rotationSpeed = rotationSpeed;
    this._state = DARTER_STATES.ROTATING;
    this._dashSpeed = 30000;

    // Set up a timer that doesn't autodestroy itself
    this._timer = this.game.time.create(false);
    this._timer.start();
    
    this._applyRandomLightnessTint(280/360, 1.0, 0.6);
}

AmbientDarter.prototype.isAttacking = function () {
    return (this._state === DARTER_STATES.CHARING ||
        this._state === DARTER_STATES.DARTING);
};

AmbientDarter.prototype.startAttack = function () {
    this._state = DARTER_STATES.CHARING;
    this._timer.add(500, function () {
        this._state = DARTER_STATES.DARTING;
    }, this);
};

AmbientDarter.prototype.update = function () {
    var elapsedSeconds = this.game.time.physicsElapsed;

    switch (this._state) {
        case DARTER_STATES.ROTATING:
            this._angle += this._rotationSpeed * elapsedSeconds;
            this.x = this._player.x + (this._radius * Math.cos(this._angle));        
            this.y = this._player.y + (this._radius * Math.sin(this._angle));
            break;
        case DARTER_STATES.CHARING:
            break;
        case DARTER_STATES.DARTING:            
            var magnitude = this._dashSpeed * elapsedSeconds;
            this.body.velocity.x = magnitude * Math.cos(this._angle + Math.PI);
            this.body.velocity.y = magnitude * Math.sin(this._angle + Math.PI);
            // if (this.x)
            // this._angle += 2 * Math.PI;
            // this._state = DARTER_STATES.ROTATING;
    }
};

AmbientDarter.prototype.destroy = function() {
    this._timer.destroy();

    Phaser.Sprite.prototype.destroy.call(this);
};