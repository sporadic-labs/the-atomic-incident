module.exports = BouncingProjectile;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var BaseProjectile = require("./base-projectile.js");

BouncingProjectile.prototype = Object.create(BaseProjectile.prototype);

function BouncingProjectile(game, x, y, key, frame, parentGroup, player, damage,
        angle, speed, maxBounces) {
    // Large range to skip destroying projectile when it has gone too far
    BaseProjectile.call(this, game, x, y, key, frame, parentGroup, player, 
        damage, angle, speed, 99999, {});
    this._maxBounces = maxBounces;
    this._numBounces = 0;

    // Make sure the projectile isn't spawning in a wall
    SpriteUtils.satSpriteVsTilemap(this, this.game.globals.tileMapLayer, 
        function () {
            this.remove = true;   
        }, this);
}

BouncingProjectile.prototype.update = function() {
    if (this.remove) {
        this.destroy();
        return;
    }

    // The SAT body needs to be updated to match the arcade body, which has
    // velocity and acceleration applied in the sprite's preUpdate method
    this.satBody.updateFromBody();

    // Collisions with the tilemap
    this._bounceX = false;
    this._bounceY = false;
    SpriteUtils.satSpriteVsTilemap(this, this.game.globals.tileMapLayer, 
        this._onCollideWithMap, this);
    
    // Use the bounce flags to update the sprite
    if (this._bounceX || this._bounceY) {
        if (this._bounceX) this.body.velocity.x *= -1;
        if (this._bounceY) this.body.velocity.y *= -1;
        this._numBounces++;
        if (this._numBounces >= this._maxBounces) this.destroy();
    }
};

BouncingProjectile.prototype._onCollideWithMap = function (self, tile, 
        response) {
    // MH: is this the correct bounce calculation? This looks at the overlap
    // vector from the SAT.js collision response. If the overlap is mostly in
    // the x-axis, flip along the x-axis. Otherwise, flip along the y-axis.
    if (Math.abs(response.overlapV.x) > Math.abs(response.overlapV.y)) {
        this._bounceX = true;
    } else {
        this._bounceY = true;
    }
    // Adjust the arcade body but not the SAT body. If the SAT body is moved, it
    // will throw off the other calculations. MH: I feel like there are edge
    // cases where this collision resolution will break, but I'm not seeing any
    // in practice
    this.body.x -= response.overlapV.x;
    this.body.y -= response.overlapV.y;
    // If projectile has already bounced along both axes, no need to check any
    // more collisions. MH: the only thing that could throw this off is the
    // collision resolution
    if (this._bounceX && this._bounceY) return true;
};

BouncingProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    // Don't destroy itself
};