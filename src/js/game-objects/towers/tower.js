module.exports = Tower;

var spriteUtils = require("../../helpers/sprite-utilities.js");

// Prototype chain - inherits from Sprite
Tower.prototype = Object.create(Phaser.Sprite.prototype);

function Tower(game, x, y, parentGroup, value, damage, light) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.game = game;
    this.damage = damage; // Damage per second
    this.value = value; // Cost for the tower
    this.light = light;

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);
}

Tower.prototype.update = function () {
    // Damage enemies
    var enemies = this.game.globals.groups.enemies;
    var damage = this.damage * this.game.time.physicsElapsed;
    spriteUtils.forEachRecursive(enemies, function (child) {
        if (child instanceof Phaser.Sprite && child.takeDamage) {
            // MH: why does world position not work here...
            var inLight = this.light.isPointInLight(child.position);
            if (inLight) {
                child.takeDamage(damage);
            }
        }
    }, this);
};

Tower.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};