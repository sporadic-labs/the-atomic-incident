module.exports = Beam;

var SpriteUtils = require("../../helpers/sprite-utilities.js");

Beam.prototype = Object.create(Phaser.Sprite.prototype);

function Beam(game, parentGroup, player) {
    this._cooldownTime = 1000;
    this._attackDuration = 200000;
    this._isAttacking = false;
    this._ableToAttack = true;
    this._damage = 20;
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

    this._collidingBox = game.make.sprite(0, 0);
    this._collidingBox.width = this._beamSize;
    this._collidingBox.height = this._beamSize;
    this._collidingBox.anchor.set(0, 0.5);
    this.addChild(this._collidingBox);
    game.physics.arcade.enable(this);
    this._collidingBox.body.setSize(this._beamSize, this._beamSize);

    this._satBody = new SAT.Polygon(new SAT.Vector(0, this.height / 2), [
      new SAT.Vector(0, -this.height / 2),
      new SAT.Vector(this.width, -this.height / 2),
      new SAT.Vector(this.width, this.height / 2),
      new SAT.Vector(0, this.height / 2)
    ]);

    this._graphics = game.make.graphics(0, 0);
    parentGroup.add(this._graphics);
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
        this.position.copyFrom(this._player.position);
        this._checkCollisions();
    }
    this._graphics.x = this.x;
    this._graphics.y = this.y;
};

Beam.prototype.destroy = function () {
    this._timer.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};

Beam.prototype._checkCollisions = function () {
    // Calculate the points of the hitbox
    var points = [
      new SAT.Vector(0, -this.height / 2).rotate(this.rotation),
      new SAT.Vector(this.width, -this.height / 2).rotate(this.rotation),
      new SAT.Vector(this.width, this.height / 2).rotate(this.rotation),
      new SAT.Vector(0, this.height / 2).rotate(this.rotation)
    ];

    // Render the points to the graphics for visualizing hitbox
    this._graphics.clear();
    this._graphics.beginFill(0x000, 0.5);
    this._graphics.drawPolygon(points)
    
    // Update SAT polygon and check for collision
    this._satBody.setPoints(points);
    this._satBody.setOffset(new SAT.Vector(this.x, this.y));
    SpriteUtils.satOverlapWithArcadeGroup(this._satBody, this, this._enemies, 
        this._onCollideWithEnemy, this);
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