module.exports = BaseEnemy;

var utils = require("../../helpers/utilities.js");
var HealthBar = require("../components/health-bar.js");
var Color = require("../../helpers/Color.js");

BaseEnemy.prototype = Object.create(Phaser.Sprite.prototype);

function BaseEnemy(game, x, y, key, frame, health, parentGroup, pointValue, color) {
    Phaser.Sprite.call(this, game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = this.game.globals.player;
    this._spawnPickups = this.game.globals.spawnPickups;
    this._pointValue = utils.default(pointValue, 1);

    // Tint the enemy based on the color.
    this.color = (color instanceof Color) ? color : new Color(color);
    this.tint = this.color.getRgbColorInt();

    // Health bar 
    var cx = 0;
    var cy = (this.height / 2) + 4;
    this._healthBar = new HealthBar(game, this, parentGroup, cx, cy, 20, 4);
    this._healthBar.initHealth(health);

    this._spawned = false; // use check if the enemy is fully spawned!

    var tween = this.game.make.tween(this)
        .to({ alpha: 0.25 }, 200, "Quad.easeInOut", true, 0, 2, true);
    // When tween is over, set the spawning flag to false.
    tween.onComplete.add(function() {
        this._spawned = true;
    }, this);

    // Configure simple physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = false;
}

BaseEnemy.prototype.takeDamage = function (damage) {
    var newHealth = this._healthBar.incrementHealth(-damage);
    if (newHealth <= 0) {
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
    this.game.tweens.removeFrom(this);
    this._healthBar.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};
