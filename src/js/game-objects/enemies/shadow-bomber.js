module.exports = ShadowBomber;

var BaseEnemy = require("./base-enemy.js");
var TargetingComponent = require("../components/targeting-component.js");

ShadowBomber.prototype = Object.create(BaseEnemy.prototype);

function ShadowBomber(game, x, y, parentGroup, color) {
    BaseEnemy.call(this, game, x, y, "assets", "shadow-enemy/bomber-idle-01", 
        200, parentGroup, 1, color);

    // Temp fix: move the health bar above the shadow/light layer
    game.globals.groups.foreground.add(this._healthBar);

    this._damage = 25; // 100 units in an explosion

    this._targetingComponent = new TargetingComponent(this, 40);

    // Override from BaseEnemy
    var diameter = 0.7 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
        (this.height - diameter) / 2);
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);

    this.body.angularVelocity = this.game.rnd.sign() *
        this.game.rnd.realInRange(25, 35);
}

ShadowBomber.prototype.update = function () {
    // Collisions with the tilemap
    this.game.physics.arcade.collide(this, this.game.globals.tileMapLayer);

    // Update targeting
    var target = this._targetingComponent.update();

    // If in range of target, attack
    if (target) {
        var distance = this.position.distance(target.position);
        // NOTE(rex): Make sure the takeDamage method exists before calling it
        // it doesn't exist on the player.
        if (distance < 30 && target.takeDamage) {
            target.takeDamage(this._damage * this.game.time.physicsElapsed);
        }
    }
};