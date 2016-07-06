module.exports = BaseEnemy;

var utils = require("../../helpers/utilities.js");
var HealthBar = require("./health-bar.js");

BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);

function BaseEnemy(game, x, y, key, frame, health, parentGroup, pointValue) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = this.game.globals.player;
    this._scoreKeepter = this.game.globals.scoreKeeper;
    this._pointValue = utils.default(pointValue, 1);

    // Health bar 
    var cx = 0;
    var cy = (this.height / 2) + 4;
    this._healthBar = new HealthBar(game, this, parentGroup, cx, cy, 20, 4);
    this._healthBar.initHealth(health);

    // Configure simple physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = false;
    this.body.setCircle(this.width / 2); // Fudge factor
}

BaseEnemy.prototype.takeDamage = function (damage) {
    var newHealth = this._healthBar.incrementHealth(-damage);
    if (newHealth <= 0) {
        this._scoreKeepter.incrementScore(this._pointValue);
        this.destroy();
        return true;
    }
    return false;
};

BaseEnemy.prototype.postUpdate = function () {
    // Post updates are where movement physics are applied. We want all post
    // updates to finish BEFORE placing extracting the sprite's position.
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Now extract sprite position and apply it to the group
    this._healthBar.updatePosition();
};

BaseEnemy.prototype.destroy = function () {
    this._healthBar.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
