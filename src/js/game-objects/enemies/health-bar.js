module.exports = HealthBar;

var utils = require("../../helpers/utilities.js");

HealthBar.prototype = Object.create(Phaser.Group.prototype);

function HealthBar(game, sprite, parentGroup, cx, cy, width, height) {
    Phaser.Group.call(this, game, parentGroup, "health-bar");
    this.position.set(cx, cy);

    this._sprite = sprite;
    this._barColor = 0xFE4B42;
    this._bgColor = 0x000;
    this._cx = cx;
    this._cy = cy;
    this._w = width;
    this._h = height;

    this._tween = null;
    this._health = null;
    this._maxHealth = null;
    
    // Center the health bar graphics within the group
    this._healthBar = game.make.graphics(-width/2, -height/2);
    this.add(this._healthBar);

    // Hide by default, only show when damage is taken
    this.hide();
}

HealthBar.prototype.initHealth = function (currentHealth, maxHealth) {
    this._health = utils.default(currentHealth, 100);
    this._maxHealth = utils.default(maxHealth, currentHealth);
    this._redraw();
};

HealthBar.prototype.incrementHealth = function (increment) {
    this._health += increment;
    this._redraw();
    this.show();
    this._scheduleFadeOut();
    return this._health;
};

HealthBar.prototype.show = function () {
    this.alpha = 1;
    this.visible = true;
};

HealthBar.prototype.hide = function () {
    this.visible = false;
};

HealthBar.prototype.updatePosition = function () {
    // Reposition the group relative to its sprite
    this.position.set(this._sprite.x + this._cx, this._sprite.y + this._cy);
};

HealthBar.prototype.destroy = function () {
    if (this._tween) this._tween.stop();
    Phaser.Group.prototype.destroy.apply(this, arguments);
};

HealthBar.prototype._scheduleFadeOut = function () {
    // Cancel previous animation
    if (this._tween) this._tween.stop();

    // Create a fade out tween after a delay
    this._tween = this.game.make.tween(this)
        .to({ alpha: 0 }, 1000, "Quad.easeInOut", true, 2000);
    this._tween.onComplete.add(this.hide.bind(this));
};

HealthBar.prototype._redraw = function () {
    // Reset
    this._healthBar.clear();
    this._healthBar.lineStyle(0);

    // Draw background of bar
    this._healthBar.beginFill(this._bgColor);
    this._healthBar.drawRect(0, 0, this._w, this._h);

    // Draw bar
    var fraction = Math.max(this._health, 0) / this._maxHealth;
    this._healthBar.beginFill(this._barColor);
    this._healthBar.drawRect(0, 0, this._w * fraction, this._h);
};
