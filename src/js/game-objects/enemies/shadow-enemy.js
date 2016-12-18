module.exports = ShadowEnemy;

var BaseEnemy = require("./base-enemy.js");
var TargetingComponent = require("../components/targeting-component.js");

ShadowEnemy.prototype = Object.create(BaseEnemy.prototype);

function ShadowEnemy(game, x, y, parentGroup) {
    BaseEnemy.call(this, game, x, y, "assets", "shadow-enemy/idle-01", 100,
        parentGroup);

    // Add an eye image that sits above the shadow layer. The enemy owns this 
    // image, so it is responsible for updating and destroying it.
    this._eyeImage = game.make.image(0, 0, "assets", "shadow-enemy/eye");
    this._eyeImage.anchor.copyFrom(this.anchor);
    game.globals.groups.foreground.add(this._eyeImage);

    // Temp fix: move the health bar above the shadow/light layer
    game.globals.groups.foreground.add(this._healthBar);

    this._damage = 10; // 10 units per second

    this._targetingComponent = new TargetingComponent(this, 50);

    // Override from BaseEnemy
    var diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this, 
        diameter / 2);

    this.body.angularVelocity = this.game.rnd.sign() *
        this.game.rnd.realInRange(25, 35);
}

ShadowEnemy.prototype.update = function () {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Update targeting
    var target = this._targetingComponent.update();

    // If in range of target, attack
    var distance = this.position.distance(target.position);
    if (distance < 30) {
        target.takeDamage(this._damage * this.game.time.physicsElapsed);
    }
};

ShadowEnemy.prototype.postUpdate = function () {
    // Force the Phaser.Sprite postUpdate to happen *first* since that is where
    // the physics gets applied
    BaseEnemy.prototype.postUpdate.apply(this, arguments);
    // Now the eye image can be properly positioned
    this._eyeImage.position.copyFrom(this.position);
};

ShadowEnemy.prototype.destroy = function () {
    this._eyeImage.destroy();
    BaseEnemy.prototype.destroy.apply(this, arguments);
};