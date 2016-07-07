module.exports = Beam;

var SpriteUtils = require("../../helpers/sprite-utilities.js");
var SatBody = require("../sat-body.js");

Beam.prototype = Object.create(Phaser.Sprite.prototype);

function Beam(game, parentGroup, player) {
    this._cooldownTime = 1000;
    this._attackDuration = 200000;
    this._isAttacking = false;
    this._ableToAttack = true;
    this._damage = 10;
    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this.visible = false;

    this._timer = game.time.create(false);
    this._timer.start();

    Phaser.Sprite.call(this, game, 0, 0, "assets", "weapons/beam");
    this.anchor.set(0, 0.5);
    parentGroup.add(this);
    this.sendToBack(); // Underneath player

    this._beamSize = this.height;
    this._range = this.width;

    this.satBody = new SatBody(this, true);
    this.satBody.initBox(this.anchor);
}

Beam.prototype.fire = function (targetPos) {
    if (this._isAttacking) {
        this.position.copyFrom(this._player.position);
        this.rotation = this._player.position.angle(targetPos);
    } else if (this._ableToAttack) {
        this._startAttack(targetPos);
    }
};

Beam.prototype.update = function () {
    if (this._isAttacking) {
        this.satBody.update(); 
        this.position.copyFrom(this._player.position);
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }
};

Beam.prototype.destroy = function () {
    this.satBody.destroy();
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Beam.prototype._startAttack = function (targetPos) {
    this.position.copyFrom(this._player.position);
    this.rotation = this._player.position.angle(targetPos);
    this._isAttacking = true;
    this.visible = true;
    this._timer.add(this._attackDuration, this._stopAttack.bind(this));
};

Beam.prototype._stopAttack = function () {
    this.visible = false;
    this._isAttacking = false;
    this._ableToAttack = false;
    // Cooldown
    this._timer.add(this._cooldownTime, function () {
        this._ableToAttack = true;
    }, this);
};

Beam.prototype._onCollideWithEnemy = function (self, enemy) {
    var isKilled = enemy.takeDamage(this._damage);
    if (isKilled) this._player.incrementCombo(1);
};