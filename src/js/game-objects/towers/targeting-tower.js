module.exports = TargetingTower;

var spriteUtils = require("../../helpers/sprite-utilities.js");
var lightUtils = require("../lights/light-utilities.js");
var Color = require("../../helpers/Color.js");

// Prototype chain - inherits from Sprite
TargetingTower.prototype = Object.create(Phaser.Sprite.prototype);

function TargetingTower(game, x, y, parentGroup, value, damage) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.game = game;
    this.damage = damage; // Damage per second
    this.value = value; // Cost for the tower
    this.targetingRadius = 200;
    this.targetingSpeed = 90 * (Math.PI / 180); // Degrees per second
    
    var lighting = game.globals.plugins.lighting;
    var polygon = lightUtils.generateSpotlightPolygon(0, 20, 250);
    this.light = lighting.addLight(new Phaser.Point(x, y), polygon, 
        new Color("rgba(255, 255, 255, 1)"));

    this._inPlacementMode = true;

    // Create the keys for controlling placement
    var keyboard = game.input.keyboard;
    this._rotateLeftKey = keyboard.addKey(Phaser.Keyboard.LEFT);
    this._rotateRightKey = keyboard.addKey(Phaser.Keyboard.RIGHT);
    this._confirmKey = keyboard.addKey(Phaser.Keyboard.ENTER);

    // Different light color for tower in "placement" mode
    this._originalLightColor = this.light.color.clone();
    var placementLightColor = this._originalLightColor.clone();
    placementLightColor.a *= 0.4;
    this.light.color = placementLightColor;

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);
}

TargetingTower.prototype.update = function () {
    var enemies = this.game.globals.groups.enemies;

    // Retarget to the closet enemy
    var closestDistance = Infinity;
    var targetPosition = null;
    spriteUtils.forEachRecursive(enemies, function (child) {
        if (child instanceof Phaser.Sprite && child.takeDamage) {
            var d = this.world.distance(child.world);
            if (d < this.targetingRadius && d < closestDistance) {
                // Target is a candidate, make sure there are no walls between
                // the light and the enemy
                var lineOfSight = new Phaser.Line(this.world.x, this.world.y,
                    child.world.x, child.world.y);
                var tiles = this.game.globals.tileMapLayer.getRayCastTiles(
                    lineOfSight, 4, true);
                if (tiles.length === 0) {
                    closestDistance = d;
                    targetPosition = child.world;
                }
            }
        }
    }, this);

    // Rotate to retarget, limited by the max turning speed
    if (targetPosition) {
        var delta = this.world.angle(targetPosition) - this.light.rotation;
        var maxDelta = this.targetingSpeed * this.game.time.physicsElapsed;
        if (delta < 0 && delta < -maxDelta) this.light.rotation -= maxDelta;
        else if (delta > 0 && delta > maxDelta) this.light.rotation += maxDelta;
        else this.light.rotation += delta;
    }

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

TargetingTower.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};