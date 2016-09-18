
module.exports = TargetingGroup;

var BaseEnemy = require("./base-enemy.js");


// -- TARGETING GROUP ----------------------------------------------------------

TargetingGroup.prototype = Object.create(Phaser.Group.prototype);
TargetingGroup.prototype.constructor = TargetingGroup;

function TargetingGroup(game, numToSpawn, x, y, enemiesGroup, target, 
    scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "dashing-group");
    // Group is positioned at (0, 0) to make coordinate system between groups
    // match. This could be changed later.

    var randSpread = 250;
    for (var i = 0; i < numToSpawn; i += 1) {
        var enemyX = x + game.rnd.realInRange(-randSpread, randSpread);        
        var enemyY = y + game.rnd.realInRange(-randSpread, randSpread);
        new TargetingEnemy(game, enemyX, enemyY, this, i, target, scoreSignal);
    }

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = 2000 + this.game.rnd.integerInRange(0, 1000); // ms

}


TargetingGroup.prototype._startCooldown = function() {
    if (!this._changeState) return;
    this._changeState = false;
    this._cooldownTimer.add(this._cooldownTime, function () {
        this._nextState();
        this._changeState = true;
    }, this);
};

TargetingGroup.prototype.update = function () {

    Phaser.Group.prototype.update.call(this);
};







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
    CHARGING: "charging",
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
    return (this._state === DARTER_STATES.CHARGING ||
        this._state === DARTER_STATES.DARTING);
};

AmbientDarter.prototype.startAttack = function () {
    this._state = DARTER_STATES.CHARGING;
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
        case DARTER_STATES.CHARGING:
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




// -- DASHING INDIVIDUAL ------------------------------------------------------
var ANIM_NAMES = {
    MOVE: "move",
    AIM: "aim",
    ATTACK: "attack"
};

var MOVE_STATES = {
    IDLE: "idle",
    AIM: "aim",
    ROTATING: "rotating",
    DASH: "dash"
};

TargetingEnemy.prototype = Object.create(BaseEnemy.prototype);
TargetingEnemy.prototype.constructor = TargetingEnemy;

function TargetingEnemy(game, x, y, parentGroup, id, target, scoreSignal) {
    BaseEnemy.call(this, game, x, y, "assets", "enemy03/move-01", parentGroup,
        target, scoreSignal, 1);
    // this.scale.setTo(0.5);
    
    this._applyRandomLightnessTint(0.33, 1, 0.5);

    // Setup animations
    var moveFrames = Phaser.Animation.generateFrameNames("enemy03/move-", 1, 4, 
        "", 2);
    var attackFrames = Phaser.Animation.generateFrameNames("enemy03/attack-", 1,
        4, "", 2);
    var aimFrames = Phaser.Animation.generateFrameNames("enemy03/aim-", 1, 4, 
        "", 2);
    this.animations.add(ANIM_NAMES.MOVE, moveFrames, 10, true);
    this.animations.add(ANIM_NAMES.ATTACK, attackFrames, 16, true);
    this.animations.add(ANIM_NAMES.AIM, aimFrames, 10, true);
    this.animations.play(ANIM_NAMES.MOVE);

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = 1000 + this.game.rnd.integerInRange(0, 500); // ms

    this._moveState = MOVE_STATES.IDLE;
    this._customDrag = 1000;
    this._maxSpeed = 200;
    this._changeState = true;

    // Variables for random movement toward player
    this._speed = this.game.rnd.realInRange((this._maxSpeed*0.2), (this._maxSpeed*0.26));
    this._angle = this.game.rnd.realInRange(0.0, 1.0) * (2*Math.PI);

    this._id = id;
}


TargetingEnemy.prototype.preUpdate = function() {
    var elapsedSeconds = this.game.time.physicsElapsed;

    this.body.velocity.set(0);


    this._angle += this._rotationSpeed * elapsedSeconds;
    this.x = this._player.x + (this._radius * Math.cos(this._angle));        
    this.y = this._player.y + (this._radius * Math.sin(this._angle));

    this.body.velocity.x = this._speed * Math.cos(this._angle);
    this.body.velocity.y = this._speed * Math.sin(this._angle);

    if (!this.body.velocity.isZero()) {
        var dragMagnitude = this._customDrag * this.game.time.physicsElapsed;
        if (this.body.velocity.getMagnitude() < dragMagnitude) {
            // Snap to 0 velocity so that we avoid the drag causing the velocity
            // to flip directions and end up oscillating
            this.body.velocity.set(0);
        } else {
            // Apply drag in opposite direction of velocity
            var drag = this.body.velocity.clone()
                .setMagnitude(-1 * dragMagnitude); 
            this.body.velocity.add(drag.x, drag.y);
        }
    }

    this._startCooldown();

    return Phaser.Sprite.prototype.preUpdate.call(this);
};

TargetingEnemy.prototype._startCooldown = function() {
    if (!this._changeState) return;
    this._changeState = false;
    this._cooldownTimer.add(this._cooldownTime, function () {
        this._nextState();
        this._changeState = true;
    }, this);
};

TargetingEnemy.prototype._nextState = function() {
    switch (this._moveState) {
        case MOVE_STATES.IDLE:
            // setup aim state
            this._cooldownTime = 500 + this.game.rnd.integerInRange(0, 500);
            this._moveState = MOVE_STATES.AIM;
            this._speed = 0.0;
            this._angle = 0.0;
            this.animations.play(ANIM_NAMES.AIM);
            break;
        case MOVE_STATES.AIM:
            // setup dash state
            this._cooldownTime = 2000 + this.game.rnd.integerInRange(0, 1000);
            this._moveState = MOVE_STATES.DASH;
            this._speed = this.game.rnd.realInRange((this._maxSpeed*0.8), this._maxSpeed);
            this._angle = this.position.angle(this._target.position);
            this.animations.play(ANIM_NAMES.ATTACK);
            break;
        case MOVE_STATES.ROTATING:
            // setup aim state
            this._cooldownTime = 500 + this.game.rnd.integerInRange(0, 500);
            this._moveState = MOVE_STATES.AIM;
            this._speed = 0.0;
            this._angle = 0.0;
            this.animations.play(ANIM_NAMES.AIM);
            break;
        case MOVE_STATES.DASH:
            // setup idle state
            this._cooldownTime = 1000 + this.game.rnd.integerInRange(0, 500);
            this._moveState = MOVE_STATES.IDLE;
            this._speed = this.game.rnd.realInRange((this._maxSpeed*0.2), (this._maxSpeed*0.26));
            this._angle = this.game.rnd.realInRange(0.0, 1.0) * (2*Math.PI);
            this.animations.play(ANIM_NAMES.MOVE);
            break;
    }
};

TargetingEnemy.prototype.getId = function () {
    return this._id;
};

TargetingEnemy.prototype.destroy = function() {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.call(this);
};

