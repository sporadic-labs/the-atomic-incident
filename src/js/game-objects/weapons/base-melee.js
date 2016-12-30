module.exports = BaseMelee;

var utils = require("../../helpers/utilities.js");
var SpriteUtils = require("../../helpers/sprite-utilities.js");

BaseMelee.prototype = Object.create(Phaser.Sprite.prototype);

function BaseMelee(game, key, frame, weaponName, parentGroup, player, damage) {
    Phaser.Sprite.call(this, game, player.x, player.y, key, frame);
    this.anchor.set(0.5, 1.0);
    parentGroup.add(this);

    this._player = player;
    this._enemies = this.game.globals.groups.enemies;
    this._name = weaponName;

    // Set up a timer that doesn't autodestroy itself
    this._cooldownTimer = this.game.time.create(false);
    this._cooldownTimer.start();
    this._cooldownTime;
    this._specialCooldownTime;

    this._ableToAttack = true;
    this._swingDir = 1;
    this._damage = damage;

    this.visible = false;
    this._swingTween = null; 

    this.game.physics.arcade.enable(this);
    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this)
        .setPivot(0, this.height);
}

BaseMelee.prototype.postUpdate = function () {
    if (this.visible) {
        this.position.x = this._player.position.x;
        this.position.y = this._player.position.y;

        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
};

BaseMelee.prototype.swing = function (targetPos, angle) {
    // start angle
    var halfAngle = (angle/2) * (Math.PI/180) * this._swingDir;
    this.rotation = this._player.position.angle(targetPos) +
        (Math.PI/2) - halfAngle;
    var pos = (this._player.position.angle(targetPos) + (Math.PI/2) -
        halfAngle) * (180/Math.PI);
    // Angle Calculation correction
    if (pos < 360 && pos > 180) {
        pos -= 360;
    }
    var endAngle = pos + (this._swingDir * angle); // tweens take degrees

    this._swing = this.game.add.tween(this).to({angle: endAngle}, 
        this._cooldownTime, "Quad.easeInOut", false, 0, 0, false);
    this._swing.onComplete.add(function() {
        this.visible = false;
        this._ableToAttack = true;
        this._swingDir *= -1;
    }, this);

    this.visible = true;
    this._ableToAttack = false;

    this._swing.start();
};

BaseMelee.prototype.specialSwing = function (targetPos, angle) {
    // start angle
    this.rotation = this._player.position.angle(targetPos) + (Math.PI/2);
    var pos = (this._player.position.angle(targetPos) + (Math.PI/2)) * 
        (180/Math.PI);
    // Angle Calculation correction
    if (pos < 270 && pos > 180) {
        pos -= 360;
    }
    var endAngle = pos + angle; // for some reason tweens take degrees

    this._swing = this.game.add.tween(this).to({angle: endAngle}, 
        this._specialCooldownTime, "Quad.easeInOut", false, 0, 0, false);
    this._swing.onComplete.add(function() {
        this._ableToAttack = true;
        this.visible = false;
    }, this);

    this.visible = true;
    this._ableToAttack = false;

    this._swing.start();
};

BaseMelee.prototype.hideWeapon = function () {
    this._swingTween.stop();
    this.visible = false;
};

BaseMelee.prototype.initCooldown = function (cooldownTime, 
    specialCooldownTime) {
    // Set up default cooldown times
    this._cooldownTime = cooldownTime;
    this._specialCooldownTime = utils.default(specialCooldownTime, 
        cooldownTime);
};

BaseMelee.prototype._startCooldown = function (time) {
    if (!this._ableToAttack) return;
    this._ableToAttack = false;
    // this.visible = false;
    this._cooldownTimer.add(time, function () {
        this._ableToAttack = true;
        // this._swingDir = this._swingDir * -1;
    }, this);
};

BaseMelee.prototype._checkOverlapWithGroup = function (group, callback, 
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

BaseMelee.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};

BaseMelee.prototype.destroy = function () {
    this._cooldownTimer.destroy();
    this.game.tweens.removeFrom(this);
    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
