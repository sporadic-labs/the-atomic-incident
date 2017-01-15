module.exports = CarriableLight;

var utils = require("../helpers/utilities.js");

// Prototype chain - inherits from Sprite
CarriableLight.prototype = Object.create(Phaser.Sprite.prototype);

function CarriableLight(game, x, y, parentGroup, radius, color, health) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);
    var c = Phaser.Color.valueToColor(color);
    this.tint = Phaser.Color.getColor(c.r, c.g, c.b);

    this._lighting = game.globals.plugins.lighting;

    this.originalRadius = this.radius = radius;
    this.originalHealth = this.health = utils.default(health, 100);
    this._healthRechargeRate = 3; // Health per second
    this._rechargeDelay = 0.5; // Delay after taking damage before recharging
    this._timeSinceDamage = 0;
    this.light = this._lighting.addLight(new Phaser.Point(x, y), radius, color);

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width);
}

CarriableLight.prototype.pickUp = function (carrier) {
    this.body.enable = false;
    this.visible = false;
    this._carrier = carrier;
    this._beingCarried = true;
};

CarriableLight.prototype.drop = function () {
    this.body.enable = true;
    this.visible = true;
    this._carrier = null;
    this._beingCarried = false;
};

CarriableLight.prototype.takeDamage = function (amount) {
    this.health -= amount;
    if (this.health <= 0) {
        this.health = 0;
        this.destroy();
    }
    this._timeSinceDamage = 0;
}

CarriableLight.prototype.update = function () {
    // Update the health
    var elapsed = this.game.time.physicsElapsed
    this._timeSinceDamage += elapsed;
    if (this._timeSinceDamage > this._rechargeDelay) {
        this.health += this._healthRechargeRate * elapsed;
        if (this.health > this.originalHealth) {
            this.health = this.originalHealth;
        }
    }
    // Update the radius based on the health
    this.radius = (this.health / this.originalHealth) * this.originalRadius;
    this.light.radius = this.radius;
    // Update the position if being carried
    if (this._beingCarried) {
        this.position.copyFrom(this._carrier.position);
    }
    this.light.position.copyFrom(this.position);
};

CarriableLight.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};