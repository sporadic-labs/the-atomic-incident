module.exports = Sword;

var BaseWeapon = require("./base-weapon.js");
var Projectile = require("./base-projectile.js");

Sword.prototype = Object.create(BaseWeapon.prototype);

// optional settings for projectiles
var projectileOptions = {
    isDestructible: false,
    rotateOnSetup: false,
    canBounce: false,
    hiddenOnSetup: true
};

function Sword(game, parentGroup, player, cooldownTime, specialCooldownTime) {
    BaseWeapon.call(this, game, parentGroup, "Sword", player, cooldownTime, 
        specialCooldownTime);

    this._endAngle = (Math.PI/2);
    this._angle = this._endAngle - (Math.PI/2); // Radians
    this._isSwinging = false;
    this._isDrawn = false; // checks if the fire button is held down
    this._swingSpeed = 0.12;
    
    this._weapon = new Projectile(this.game, this._player.position.x,
        this._player.position.y, "assets", "weapons/sword", this, player, 
        this._angle, 0, 10000, projectileOptions);
}

Sword.prototype.update = function() {
    var x = this._player.position.x + (1.0 * this._player.width) * 
        Math.cos(this._angle);
    var y = this._player.position.y + (1.0 * this._player.width) * 
        Math.sin(this._angle);
    if (this._isSwinging && this._angle < this._endAngle) {
        this._isDrawn = true;
        this._angle += this._swingSpeed;
    } else {
        this._isSwinging = false;
    }

    if (this._isDrawn)
        this._drawSword(x, y, this._angle);
    else
        this._sheatheSword();

    // console.log(this._isDrawn);
};

Sword.prototype.fire = function (targetPos) {
    if (this.isAbleToAttack()) {

        // Find trajectory
        this._endAngle = this._player.position.angle(targetPos);
        this._angle = this._endAngle - (Math.PI/2); // Radians

        var x = this._player.position.x + (1.0 * this._player.width) * 
            Math.cos(this._angle);
        var y = this._player.position.y + (1.0 * this._player.width) * 
            Math.sin(this._angle);

        this._isSwinging = true;
        this._isDrawn = true;
        this._swingSpeed = 0.12;
        this._drawSword(x, y, this._angle);
        this._startCooldown();
    }
};

Sword.prototype.specialFire = function () {
    if (this.isAbleToAttackSpecial()) {
        // Find trajectory
        this._endAngle = (3*Math.PI/2);
        this._angle = this._endAngle - (2*Math.PI); // Radians
        var x = this._player.position.x + (1.0 * this._player.width) * 
            Math.cos(this._angle);
        var y = this._player.position.y + (1.0 * this._player.width) * 
            Math.sin(this._angle);

        this._isSwinging = true;
        this._isDrawn = true;
        this._swingSpeed = 0.24;
        this._drawSword(x, y, this._angle);
        this._startCooldown();

    }
};

Sword.prototype._drawSword = function (x, y, angle) {
    this._weapon.position.x = x;
    this._weapon.position.y = y;
    this._weapon.rotation = angle;
    this._weapon.visible = true;
};

Sword.prototype._sheatheSword = function () {
    this._weapon.visible = false;
    this._isDrawn = false;
    this._isSwinging = false;
};