module.exports = Sword;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

Sword.prototype = Object.create(Phaser.Sprite.prototype);

function Sword(game, parentGroup, player, cooldownTime, specialCooldownTime) {
    Phaser.Sprite.call(this, game, 0, 0, "assets", "weapons/sword");
    this.anchor.set(0.5, 1.0);
    parentGroup.add(this);

    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = cooldownTime; // Milliseconds 
    this._specialCooldownTime = specialCooldownTime; // Milliseconds 

    this._isSwinging = false;
    this._ableToAttack = true;
    this._swingSpeed = 0.1;
    this._angle = 0;
    this._endAngle = 0;
    this._swingDir = 1;
    this._damage = 25;

    this.visible = false;
    
    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this, 26, 
        this.height);
}

Sword.prototype.update = function () {
    if ((this._angle < this._endAngle && this._swingDir < 0) || 
        (this._angle > this._endAngle && this._swingDir > 0)) {
        this._isSwinging = false;
        this.visible = false;
        this._swingDir = this._swingDir * -1;
    }

    if (this._isSwinging) {
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);

        this.position.x = this._player.position.x + (0.5 * this._player.width) *
            Math.cos(this._angle);
        this.position.y = this._player.position.y + (0.5 * this._player.width) *
            Math.sin(this._angle);
        this.rotation = this._angle+(Math.PI/2);
        
        if (this._swingDir > 0)
            this._angle += this._swingSpeed;
        else
            this._angle -= this._swingSpeed;

        this.visible = true;
    }
};

Sword.prototype.fire = function (targetPos) {
    if (this._ableToAttack) {
        // Find angle
        this._isSwinging = true;
        this._startAngle = this._player.position.angle(targetPos) - 
            (this._swingDir * Math.PI/2); // Radians
        this._endAngle = this._player.position.angle(targetPos) + 
            (this._swingDir * Math.PI/2); // Radians
        this._angle = this._startAngle;

        this._startCooldown(this._cooldownTime);
    }
};

Sword.prototype.specialFire = function (targetPos) {
    if (this._ableToAttack) {
        // Find angle
        this._isSwinging = true;
        this._startAngle = this._player.position.angle(targetPos); // Radians
        this._endAngle = this._player.position.angle(targetPos) + 
            (4*Math.PI); // Radians
        this._angle = this._startAngle;

        this._startCooldown(this._specialCooldownTime);

    }
};

Sword.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};

Sword.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    // this.visible = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
    }, this);
};

Sword.prototype.destroy = function () {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
