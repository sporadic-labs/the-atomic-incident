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
}

BouncingProjectile.prototype.update = function() {
    // Debugging checks
    // console.log(`
    //     pos:        ${this.position.x} + ${this.position.y}
    //     previous:   ${this.previousPosition.x} + ${this.previousPosition.y}
    //     body pos:   ${this.body.x} + ${this.body.y}
    //     body prev:  ${this.body.prev.x} + ${this.body.prev.y}
    //     sat:        ${this.satBody._body.pos.x} + ${this.satBody._body.pos.y}
    // `)

    // The velocity and acceleration are applied to the arcade body in the 
    // sprite's preUpdate function. The SAT body needs to be updated from the
    // sprite body. MH: this calculation isn't quite perfect and is hard coded
    // for the sprite having a scale of 1 and an anchor of (0.5, 0.5). This 
    // updating should be offloaded to the SAT body plugin!
    this.satBody._body.pos.x = this.body.x + (this.width / 2);
    this.satBody._body.pos.y = this.body.y + (this.height / 2);

    // Collisions with the tilemap
    this._bounceX = false;
    this._bounceY = false;
    SpriteUtils.satSpriteVsTilemap(this, this.game.globals.tileMapLayer, 
        this._onCollideWithMap, this);

    if (this._bounceX) this.body.velocity.x *= -1;
    if (this._bounceY) this.body.velocity.y *= -1;
    if (this._bounceX || this._bounceY) this._numBounces++;
    if (this._numBounces >= this._maxBounces) this.destroy();
};

BouncingProjectile.prototype._onCollideWithMap = function (self, tile, 
        response) {
    if (Math.abs(response.overlapV.x) > Math.abs(response.overlapV.y)) {
        this._bounceX = true;
    } else {
        this._bounceY = true;
    }
    // If projectile has already bounced along both axes, no need to check any
    // more collisions
    if (this._bounceX && this._bounceY) return true;
};

BouncingProjectile.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
    // Don't destroy itself
};