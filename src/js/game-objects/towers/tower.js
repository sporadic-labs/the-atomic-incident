module.exports = Tower;

var spriteUtils = require("../../helpers/sprite-utilities.js");
var Color = require("../../helpers/Color.js");

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

    this._inPlacementMode = true;

    // Create the keys for controlling placement
    var keyboard = game.input.keyboard;
    this._rotateLeftKey = keyboard.addKey(Phaser.Keyboard.LEFT);
    this._rotateRightKey = keyboard.addKey(Phaser.Keyboard.RIGHT);
    this._confirmKey = keyboard.addKey(Phaser.Keyboard.ENTER);

    // Different light color for tower in "placement" mode
    this._originalLightColor = light.color.clone();
    var placementLightColor = this._originalLightColor.clone();
    placementLightColor.a *= 0.4;
    this.light.color = placementLightColor;

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);
}

Tower.prototype.update = function () {
    if (this._inPlacementMode) {
        if (this._rotateLeftKey.isDown) {
            this.light.rotation -= Math.PI * this.game.time.physicsElapsed;
        } else if (this._rotateRightKey.isDown) {
            this.light.rotation += Math.PI * this.game.time.physicsElapsed;
        } else if (this._confirmKey.isDown) {
            this._inPlacementMode = false;
            this.light.color = this._originalLightColor;
        }
        // Keep light slighting in front of the player
        var player = this.game.globals.player;
        var playerHeading = player.rotation - (Math.PI/2);
        var offset = player.width * 1.20;
        this.position.set(
            player.position.x + offset * Math.cos(playerHeading),
            player.position.y + offset * Math.sin(playerHeading)
        );
    } else {
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
    }

    // Keep the light in sync with the tower's position
    this.light.position.copyFrom(this.position);
};

Tower.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};