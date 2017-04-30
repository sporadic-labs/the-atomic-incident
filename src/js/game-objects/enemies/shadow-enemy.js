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
    var diameter = 0.1 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);

    this.body.angularVelocity = this.game.rnd.sign() *
        this.game.rnd.realInRange(25, 35);

    this._dieSound = this.game.globals.soundManager.add("pop");
    this._dieSound.playMultiple = true;
    
    // If the level has changed, make sure the enemy is not inside of a wall
    this._levelManager = game.globals.levelManager;
    this._levelManager.levelChangeSignal.add(this._checkCollision, this);
}

ShadowEnemy.prototype._checkCollision = function () {
    const wallLayer = this._levelManager.getCurrentWallLayer();

    // Get all colliding tiles that are within range and destroy if there are any
    const pad = 0;
    const tiles = wallLayer.getTiles(
        this.position.x - pad, this.position.y - pad,
        this.width + pad, this.height + pad, 
        true
    );
    if (tiles.length > 0) this.destroy();
};

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
    this.game.physics.arcade.collide(this, this.game.globals.levelManager.getCurrentWallLayer());
    
    // Update any components - loop in reverse to allow components to be removed
    for (let i = this._components.length - 1; i >= 0; i--) {
        this._components[i].update();
    }
};

ShadowEnemy.prototype.destroy = function () {
    this._levelManager.levelChangeSignal.remove(this._checkCollision, this);
    this._dieSound.play();
    for (const component of this._components) component.destroy();
    BaseEnemy.prototype.destroy.apply(this, arguments);
};