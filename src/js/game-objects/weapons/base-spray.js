module.exports = BaseSpray;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

BaseSpray.prototype = Object.create(Phaser.Sprite.prototype);

// options is an object containing some optional settings for the
// base projectile class
// - rotateOnSetup - bool
// - canBurn - bool
// - speedModifier - range (0 - 1.0)
// - sizeModifier - range (0 - 1.0 (or higher I guess...))
// - initialSize - range (0 - 1.0 (again, I guess higher...))
// - maxSize - range (you know the drill...)
function BaseSpray(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed, life, options) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._damage = damage;
    this._speed = speed;
    this._age = 0;
    this._life = life;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseSpray should be removed?


    // projectile options
    if (options !== undefined && options.rotateOnSetup !== undefined)
        this._rotateOnSetup = options.rotateOnSetup;
    else this._rotateOnSetup = true;
    if (options !== undefined && options.canBurn !== undefined)
        this._canBurn = options.canBurn;
    else this._canBurn = false;
    if (options !== undefined && options.speedModifier !== undefined)
        this._speedModifier = options.speedModifier;
    else this._speedModifier = 1.0;
    if (options !== undefined && options.sizeModifier !== undefined)
        this._sizeModifier = options.sizeModifier;
    else this._sizeModifier = 1.0;
    if (options !== undefined && options.initialSize !== undefined)
        this._initialSize = options.initialSize;
    else this._initialSize = 1.0;
    if (options !== undefined && options.maxSize !== undefined)
        this._maxSize = options.maxSize;
    else this._maxSize = 1.0;

    // If rotateOnSetup option is true, rotate projectile to face in the
    // right direction. Sprites are saved facing up (90 degrees), so we
    // need to offset the angle
    if (this._rotateOnSetup)
        this.rotation = angle + (Math.PI / 2); // Radians
    else
        this.rotation = angle;

    // Set intial scale
    this.scale.setTo(this._initialSize, this._initialSize);
    // Error checking, you can't have a different min and max size
    // if the size modifier is 0...
    if (this._initialSize !== this._maxSize && this.sizeModifier === 1.0) {
        this._maxSize = this._initialSize
    }

    // Physics
    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
        this._speed, this.body.velocity);
    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
}

BaseSpray.prototype.update = function() {
    // Update the age counter of the spray
    this._age++;

    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer,
        this._onCollideWithMap);

    // If a decate rate is set, apply it to the velocity.
    if (this._speedModifier !== 1.0) {
        this.body.velocity.x = this.body.velocity.x * this._speedModifier;
        this.body.velocity.y = this.body.velocity.y * this._speedModifier;
    }

    // If the size modifier is set, apply it as well.
    if (this._sizeModifier !== 1.0 && this.scale.x < this._maxSize) {
        var x = this.scale.x * this._sizeModifier; // 1.0264
        var y = this.scale.y * this._sizeModifier; // 1.0264
        this.scale.setTo(x, y);
    }

    // If the projectile can burn, check each tile for a fire.
    // If one exists, ignore the tile and keep moving.  If there is no fire,
    // destroy the projectile and create a fire.
    if (this._canBurn && this.checkTileMapLocation(this.position.x,
        this.position.y)) {
        // this isn't working yet...
    }

}

BaseSpray.prototype.postUpdate = function () {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap
    SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
        this._onCollideWithEnemy, this);
    // If projectile has collided with an enemy, or is out of life, remove it
    if ((this._age > this._life) || (this._remove)) {
        this.destroy();
    }
};

BaseSpray.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

// eslint-disable-next-line no-unused-vars
BaseSpray.prototype._onCollideWithMap = function (self, map) {
    if (self._isDestructable) {
        self._remove = true;
    }
};

BaseSpray.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    self._remove = true;
};

BaseSpray.prototype.checkTileMapLocation = function(x, y) {
    var checkTile = this.game.globals.tileMap.getTileWorldXY(x, y, 36, 36,
        this.game.globals.tileMapLayer);
    if (checkTile === null || checkTile === undefined) return true;
    else return false;
}
