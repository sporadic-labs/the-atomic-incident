module.exports = ProjectileTower;

var spriteUtils = require("../../helpers/sprite-utilities.js");
var lightUtils = require("../lights/light-utilities.js");
var Color = require("../../helpers/Color.js");

var UI_MODE = {
    PLACING_POSITION: "placing position",
    SETTING_ROTATION: "setting rotation",
    FINISHED_PLACEMENT: "finished placement"
};

// Prototype chain - inherits from Sprite
ProjectileTower.prototype = Object.create(Phaser.Sprite.prototype);

function ProjectileTower(game, x, y, parentGroup, value, damage) {
    Phaser.Sprite.call(this, game, x, y, "assets", "light/light");
    this.anchor.set(0.5);
    parentGroup.add(this);

    this.game = game;
    this.damage = damage; // Damage per second
    this.value = value; // Cost for the tower

    var lighting = game.globals.plugins.lighting;
    this.light = lighting.addLight(
        new Phaser.Point(x, y), 
        new Phaser.Circle(0, 0, 200), 
        new Color("rgba(255, 255, 255, 1)")
    );

    this._uiMode = UI_MODE.PLACING_POSITION;

    // UI handlers for placing and rotating the tower
    var rightButtonDown = this.game.input.activePointer.rightButton.onDown;
    var onFirstClick = function () {
        // Position set, move to setting rotation
        this._uiMode = UI_MODE.SETTING_ROTATION;
        rightButtonDown.addOnce(onSecondClick, this);
    };
    var onSecondClick = function () {
        // Rotation set, finished placement
        this._uiMode = UI_MODE.FINISHED_PLACEMENT;
        this.light.color = this._originalLightColor;
    }
    rightButtonDown.addOnce(onFirstClick, this);

    // Different light color for tower in "placement" mode
    this._originalLightColor = this.light.color.clone();
    var placementLightColor = this._originalLightColor.clone();
    placementLightColor.a *= 0.4;
    this.light.color = placementLightColor;

    game.physics.arcade.enable(this);
    this.body.immovable = true;
    this.body.setCircle(this.width / 2);

    this._timeSinceFired = 0;
}

ProjectileTower.prototype.update = function () {
    if (this._uiMode == UI_MODE.PLACING_POSITION) {
        // Keep light slighting in front of the player
        var player = this.game.globals.player;
        var playerHeading = player.rotation - (Math.PI/2);
        var offset = player.width * 1.20;
        this.position.set(
            player.position.x + offset * Math.cos(playerHeading),
            player.position.y + offset * Math.sin(playerHeading)
        );
        // Keep the light in sync with the tower's position
        this.light.position.copyFrom(this.position); 
    } else if (this._uiMode == UI_MODE.SETTING_ROTATION) {
        var mousePoint = new Phaser.Point(
            this.game.input.mousePointer.x + this.game.camera.x,
            this.game.input.mousePointer.y + this.game.camera.y
        );
        this.light.rotation = this.light.position.angle(mousePoint);
        // Keep the light in sync with the tower's position
        this.light.position.copyFrom(this.position); 
    } else {
        var d = 150 * this.game.time.physicsElapsed;
        this.light.position.x += Math.cos(this.light.rotation) * d;
        this.light.position.y += Math.sin(this.light.rotation) * d;

        this._timeSinceFired += this.game.time.physicsElapsed;
        if (this._timeSinceFired > 2) {
            this._timeSinceFired = 0;
            this.light.position.copyFrom(this.position); 
        } 

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
};

ProjectileTower.prototype.destroy = function () {
    this.light.destroy();
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
};