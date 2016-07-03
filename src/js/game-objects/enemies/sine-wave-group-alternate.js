module.exports = SineWaveGroup;

var BaseEnemy = require("./base-enemy.js");
var utils = require("../../helpers/utilities.js");


// -- GROUP --------------------------------------------------------------------

SineWaveGroup.prototype = Object.create(Phaser.Group.prototype);

function SineWaveGroup(game, numToSpawn, enemiesGroup, player, scoreSignal) {
    Phaser.Group.call(this, game, enemiesGroup, "sine-wave-group");
    
    this._player = player;
    this._scoreSignal = scoreSignal;
    this._lineLength = 600;

    // Place the group directly over the player
    this.position.copyFrom(this._player);
    
    // Sine wave paramters
    //  angle - starting phase for the group. This shifts the whole sinewave and
    //          is used to turn the sine wave into a cosine wave. This spawns
    //          the wave around the player without a collision.
    //  amplitude - height of the wave
    //  angularSpeed - radians/second, how fast the line osciallates
    this._angle = Math.PI / 2;
    this._amplitude = 300;
    this._angularSpeed = Math.PI / 3;

    // Pick a rotation for the sine wave
    var rotationAngle = this.game.rnd.realInRange(0, 2 * Math.PI);    
    
    this._spawnSineEnemies(numToSpawn, rotationAngle);
}

SineWaveGroup.prototype.getAngle = function () { 
    return this._angle;
};

SineWaveGroup.prototype._spawnSineEnemies = function (numToSpawn, rotation) {
    // Find the direction along which the enemies should be placed. This is a 
    // straight line that is in the desired direction of the sine wave.
    lineDirection = utils.pointFromAngle(rotation);

    // Find the direction that the straight line needs to be displaced in order
    // to form a sine wave. This is perpendicular to the straight line.
    sinDirection = utils.pointFromAngle(rotation + (Math.PI / 2));

    // Calculate the starting point for placing the sprites, e.g. move half the
    // group's length in the opposite direction of line
    var startPoint = new Phaser.Point(
        -lineDirection.x * (this._lineLength / 2),
        -lineDirection.y * (this._lineLength / 2)
    );

    // Create sine wave of enemies
    for (var i = 0; i < numToSpawn; i += 1) {
        var fraction = (i / (numToSpawn - 1));
        // Find the location along the straight line
        var linePoint = startPoint.clone().add(
            lineDirection.x * (fraction * this._lineLength),
            lineDirection.y * (fraction * this._lineLength)
        )
        var amplitude = 2 * Math.abs(fraction - 0.5) * this._amplitude;
        if (fraction < 0.5) {
            amplitude = this._amplitude * (fraction * 2);
        } else {
            amplitude = this._amplitude * ((fraction - 1) * -2)
        }        
        var phase = 0;fraction * (Math.PI);
        // Create the enemy
        var sineEnemy = new SineEnemy(this.game, this, phase, linePoint,
            sinDirection, amplitude, this._player, this._scoreSignal);
        // Set it's rotation so sprite is facing in the attack direction
        sineEnemy.rotation = rotation;
    }
};

SineWaveGroup.prototype.update = function() {
    this._angle += this._angularSpeed * this.game.time.physicsElapsed;
    Phaser.Group.prototype.update.apply(this, arguments);
};


// -- INDIVIDUAL ---------------------------------------------------------------

SineEnemy.prototype = Object.create(BaseEnemy.prototype);

function SineEnemy(game, parentGroup, phase, linePoint, sinDirection, amplitude, 
    player, scoreSignal) {
    BaseEnemy.call(this, game, 0, 0, "assets", "enemy01/idle-01", parentGroup,
        player, scoreSignal, 1);

    this._phase = phase;
    this._linePoint = linePoint;
    this._sinDirection = sinDirection;
    this._amplitude = amplitude;
    this._sineGroup = parentGroup; 

    this._applyRandomLightnessTint(140/360, 1.0, 0.6);
    this._calculateSinePosition();
}

SineEnemy.prototype._calculateSinePosition = function () {
    var angle = this._phase + this._sineGroup.getAngle();
    var height = this._amplitude * Math.sin(angle)
    this.position = this._linePoint.clone().add(
        this._sinDirection.x * height, 
        this._sinDirection.y * height
    );
};

SineEnemy.prototype.update = function () {
    this._calculateSinePosition();
};