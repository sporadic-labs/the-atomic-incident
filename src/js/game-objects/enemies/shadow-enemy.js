module.exports = ShadowEnemy;

var BaseEnemy = require("./base-enemy.js");

ShadowEnemy.prototype = Object.create(BaseEnemy.prototype);

function ShadowEnemy(game, x, y, parentGroup, color) {
    BaseEnemy.call(this, game, x, y, "assets", "shadow-enemy/tintable-idle", 100,
        parentGroup, 1, color);

    // Temp fix: move the health bar above the shadow/light layer
    game.globals.groups.foreground.add(this._healthBar);

    this._components = [];

    this._damage = 10; // 10 units per second

    // Override from BaseEnemy
    var diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);

    this.body.angularVelocity = this.game.rnd.sign() *
        this.game.rnd.realInRange(25, 35);
}

ShadowEnemy.prototype.addComponent = function (component) {
    this._components.push(component);
};

ShadowEnemy.prototype.removeComponent = function (component) {
    const i = this._components.indexOf(component);
    if (i !== -1) this._components.splice(i, 1);
};

ShadowEnemy.prototype.update = function () {
    // If the enemy hasn't spawned yet, don't move or attack!
    if (!this._spawned) return;

    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);
    
    // Update any components - loop in reverse to allow components to be removed
    for (let i = this._components.length - 1; i >= 0; i--) {
        this._components[i].update();
    }
};

ShadowEnemy.prototype.destroy = function () {
    for (const component of this._components) component.destroy();
    BaseEnemy.prototype.destroy.apply(this, arguments);
};