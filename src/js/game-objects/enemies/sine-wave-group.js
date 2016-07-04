module.exports = SineWaveGroup;

var BaseEnemy = require("./base-enemy.js");
var utils = require("../../helpers/utilities.js");
var spriteUtils = require("../../helpers/sprite-utilities.js");


// -- GROUP --------------------------------------------------------------------

SineWaveGroup.prototype = Object.create(Phaser.Group.prototype);

function SineWaveGroup(game, numToSpawn) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "sine-wave-group");
    
    this._player = this.game.globals.player;
    this._lineLength = 650;

    // Place the group directly over the player
    this.position.copyFrom(this._player);
    
    // Sine wave paramters
    //  phaseOffset - shift the whole sinewave
    //  amplitude - height of the wave
    //  cycles - number of "peaks" in the wave
    //  speed - radians/second, how fast the curve moves through the line of 
    //          enemy sprites 
    // The phaseOffset here needs some explanation. Basically setting it to 
    // PI / 2 converts the wave to a cosine wave, where the player is nicely 
    // under one of the "humps." Shifting it over by PI / 4 gives the player a 
    // little more reaction time when the wave starts.
    this._phaseOffset = Math.PI / 2 - Math.PI / 4;
    this._amplitude = 200;
    this._cycles = 1;
    this._speed = Math.PI / 3;

    // Pick a rotation for the sine wave
    var rotationAngle = this.game.rnd.realInRange(0, 2 * Math.PI);    
    
    this._spawnSineEnemies(numToSpawn, rotationAngle);
}

SineWaveGroup.prototype._spawnSineEnemies = function (numToSpawn, rotation) {
    // Find the direction along which the enemies should be placed. This is a 
    // straight line that is in the desired direction of the sine wave.
    var lineDirection = utils.pointFromAngle(rotation);

    // Find the direction that the straight line needs to be displaced in order
    // to form a sine wave. This is perpendicular to the straight line.
    var sinDirection = utils.pointFromAngle(rotation + (Math.PI / 2));

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
        );
        // Find the sine wave displacement
        var angle = fraction * (this._cycles * 2 * Math.PI) + this._phaseOffset;
        // Create the enemy
        var sineEnemy = new SineEnemy(this.game, this, angle, this._speed, 
            linePoint, sinDirection, this._amplitude);
        // Set it's rotation so sprite is facing in the attack direction
        sineEnemy.rotation = rotation;
    }
};


// -- INDIVIDUAL ---------------------------------------------------------------

SineEnemy.prototype = Object.create(BaseEnemy.prototype);

function SineEnemy(game, parentGroup, angle, angularSpeed, linePoint, 
    sinDirection, amplitude) {
    BaseEnemy.call(this, game, 0, 0, "assets", "enemy01/idle-01", 100,
        parentGroup);

    this._angle = angle;
    this._angularSpeed = angularSpeed;
    this._linePoint = linePoint;
    this._sinDirection = sinDirection;
    this._amplitude = amplitude;

    spriteUtils.applyRandomLightnessTint(this, 140/360, 1.0, 0.6);
    this._calculateSinePosition();
}

SineEnemy.prototype._calculateSinePosition = function () {
    var height = this._amplitude * Math.sin(this._angle);
    this.position = this._linePoint.clone().add(
        this._sinDirection.x * height, 
        this._sinDirection.y * height
    );
};

SineEnemy.prototype.update = function () {
    this._angle += this._angularSpeed * this.game.time.physicsElapsed;
    this._calculateSinePosition();
};