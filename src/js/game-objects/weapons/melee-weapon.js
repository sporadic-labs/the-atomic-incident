module.exports = MeleeWeapon;

MeleeWeapon.prototype = Object.create(Phaser.Sprite.prototype);
MeleeWeapon.prototype.constructor = MeleeWeapon;

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

    this.visible = false;
    this._swing = null; 


    this.game.physics.arcade.enable(this);
    this.body.setSize(8*this.width/10, 8*this.height/10, -12, 12); // Fudge factor

}

MeleeWeapon.prototype.preUpdate = function () {

    this._checkOverlapWithGroup(this._enemies, this._onCollideWithEnemy, this);

    this.position.x = this._player.position.x;
    this.position.y = this._player.position.y;


    // Call the parent's preUpdate and return the value. Something else in
    // Phaser might use it...
    return Phaser.Sprite.prototype.preUpdate.apply(this, arguments);

};

MeleeWeapon.prototype.fire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) - (this._swingDir * Math.PI/2) + (Math.PI/2);
        var pos = this._player.position.angle(targetPos) * (180/Math.PI);
        var endAngle = pos + (this._swingDir * 180); // for some reason tweens take degrees

        console.log(pos);

        this._swing = this.game.add.tween(this).to({angle: endAngle}, this._cooldownTime,
            Phaser.Easing.Quadratic.InOut, false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
            this.body.enable = false;
        }, this);

        this.visible = true;
        this.body.enable = true;
        this.body.setSize(8*this.width/10, 8*this.height/10, 10*Math.cos(this._player.position.angle(targetPos)), 10*Math.sin(this._player.position.angle(targetPos))); // Fudge factor

        this._swing.start();

        this._startCooldown(this._cooldownTime);
    }
};

MeleeWeapon.prototype.specialFire = function (targetPos) {
    if (this._ableToAttack) {
        // start angle
        this.rotation = this._player.position.angle(targetPos) + (Math.PI/2);
        var pos = (this._player.position.angle(targetPos) + (Math.PI/2)) * (180/Math.PI);
        var endAngle = pos + 720; // for some reason tweens take degrees

        console.log(pos);

        this._swing = this.game.add.tween(this).to({angle: endAngle}, this._specialCooldownTime,
            Phaser.Easing.Quadratic.InOut, false, 0, 0, false);
        this._swing.onComplete.add(function() {
            this.visible = false;
            this.body.enable = false;
        }, this);

        this.visible = true;
        this.body.enable = true;
        this.body.setSize(8*this.width/10, 8*this.height/10, 10*Math.cos(this._player.position.angle(targetPos)), 10*Math.sin(this._player.position.angle(targetPos))); // Fudge factor

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
    enemy.killByPlayer();
    this._player.incrementCombo(1);
};

MeleeWeapon.prototype.destroy = function () {
    this._cooldownTimer.destroy();

    // Call the super class and pass along any arugments
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
