module.exports = ChargeStation;

var utils = require("../helpers/utilities.js");
var HealthBar = require("./components/health-bar.js");

// Prototype chain - inherits from Sprite
ChargeStation.prototype = Object.create(Phaser.Sprite.prototype);

function ChargeStation(game, x, y, parentGroup, totalCharge) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/charging");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.remainingCharge = utils.default(totalCharge, 100);
    this._chargeRate = 10; // Units of health per second

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    var diameter = 1.5 * this.width; // Generous hitbox for dropping lights
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);

    // Health bar 
    var cx = 0;
    var cy = (this.height / 2) + 7;
    var midground = this.game.globals.groups.midground;
    this._healthBar = new HealthBar(game, this, midground, cx, cy, 20, 4);
    this._healthBar._barColor = 0xf3df17;
    this._healthBar.initHealth(this.remainingCharge);
}

ChargeStation.prototype.startCharge = function (light) {
    this._lightToCharge = light;
    this._charging = true;
};

ChargeStation.prototype.stopCharge = function () {
    var light = this._lightToCharge; 
    this._lightToCharge = null;
    this._charging = false;
    return light;
};

ChargeStation.prototype.update = function () {
    // Charge the light
    if (this._charging) {
        var light = this._lightToCharge;
        // Calculate amount to charge the light, but don't let it heal the light
        // past its original health and don't let it charge more than the 
        // station's remaining charge
        var chargeAmount = Math.min(
            this._chargeRate * this.game.time.physicsElapsed,
            light.originalHealth - light.health,
            this.remainingCharge
        );
        this.remainingCharge -= chargeAmount;
        this._lightToCharge.health += chargeAmount;
        this._healthBar.incrementHealth(-chargeAmount);
    }
};

ChargeStation.prototype.postUpdate = function () {
    // Post updates are where movement physics are applied. We want all post
    // updates to finish BEFORE placing extracting the sprite's position.
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Now extract sprite position and apply it to the group
    this._healthBar.updatePosition();
    this._healthBar.show();
};

ChargeStation.prototype.destroy = function () {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};