module.exports = MeleeWeapon;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

MeleeWeapon.prototype = Object.create(Phaser.Sprite.prototype);

function MeleeWeapon(game, parentGroup, player, key, frame, cooldownTime, 
    specialCooldownTime) {
    
    Phaser.Sprite.call(this, game, player.x, player.y, key, frame);

    this.anchor.set(0.5, 1.0);
    this.pivot.y = 18;
    parentGroup.add(this);

    this._player = player;
    this._enemies = this.game.globals.groups.enemies;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime = cooldownTime; // Milliseconds 
    this._specialCooldownTime = specialCooldownTime; // Milliseconds 

    this._ableToAttack = true;
    this._swingDir = 1;
    this._damage = 50;

    this.visible = false;
    this._swing = null; 

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this, 38, 
        this.height + this.pivot.y);
}

MeleeWeapon.prototype.postUpdate = function () {
    if (this.visible) {
        this.position.x = this._player.position.x;
        this.position.y = this._player.position.y;

        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
};

MeleeWeapon.prototype.fire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) - 
            (this._swingDir * Math.PI/2) + (Math.PI/2);
        var pos = this._player.position.angle(targetPos) * (180/Math.PI);
        var endAngle = pos + (this._swingDir * 180); // tweens take degrees

        this._swing = this.game.add.tween(this).to({angle: endAngle}, 
            this._cooldownTime, "Quad.easeInOut", false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
        }, this);

        this.visible = true;

        this._swing.start();

        this._startCooldown(this._cooldownTime);
    }
};

MeleeWeapon.prototype.specialFire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) + (Math.PI/2);
        var pos = (this._player.position.angle(targetPos) + (Math.PI/2)) * 
            (180/Math.PI);
        var endAngle = pos + 720; // for some reason tweens take degrees

        this._swing = this.game.add.tween(this).to({angle: endAngle}, 
            this._specialCooldownTime, "Quad.easeInOut", false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
        }, this);

        this.visible = true;
        this._swing.start();

        this._startCooldown(this._cooldownTime);

    }
};

MeleeWeapon.prototype.hideWeapon = function () {
    this._swing.stop();
    this.visible = false;
};

MeleeWeapon.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    // this.visible = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
        // this._swingDir = this._swingDir * -1;
    }, this);
};

MeleeWeapon.prototype._checkOverlapWithGroup = function (group, callback, 
    callbackContext) {
    for (var i = 0; i < group.children.length; i += 1) {
        var child = group.children[i];
        if (child instanceof Phaser.Group) {
            this._checkOverlapWithGroup(child, callback, callbackContext);
        } else {
            this.game.physics.arcade.overlap(this, child, callback, null, 
                callbackContext);
        }
    }
};

MeleeWeapon.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};

MeleeWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();
    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
