module.exports = BouncingProjectile;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var BaseProjectile = require("./base-projectile.js");

BouncingProjectile.prototype = Object.create(BaseProjectile.prototype);

function BouncingProjectile(game, x, y, key, frame, parentGroup, player, damage,
        angle, speed, maxBounces) {
    BaseProjectile.call(this, game, x, y, key, frame, parentGroup, player, 
        damage, angle, speed, 99999, {});
    this._maxBounces = maxBounces;
    this._numBounces = 0;
    // Large range to skip destroying projectile when it has gone too far
}

BouncingProjectile.prototype.update = function() {
    // Collisions with the tilemap
    this._hasBounced = false;
    SpriteUtils.satSpriteVsTilemap(this, this.game.globals.tileMapLayer, 
        true, true, this._onCollideWithMap, this);
    if (this._hasBounced) this._numBounces++;
    if (this._numBounces >= this._maxBounces) this.destroy();
}


BouncingProjectile.prototype._onCollideWithMap = function (self, tile, 
        response) {
    this._hasBounced = true;
    if (Math.abs(response.overlapV.x) > Math.abs(response.overlapV.y)) {
        this.body.velocity.x *= -1;
    } else {
        this.body.velocity.y *= -1;
    }    
};

BaseProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    // Don't destroy itself
};