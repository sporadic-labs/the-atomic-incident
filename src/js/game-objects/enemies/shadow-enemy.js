const BaseEnemy = require("./base-enemy.js");
const Color = require("../../helpers/Color.js");
const AvoidComp = require("../components/avoid-component");
const TargetingComp = require("../components/targeting-component");

class ShadowEnemy extends BaseEnemy {
    constructor(game, x, y, parentGroup, color, shieldColor) {
        super(game, x, y, "assets", "shadow-enemy/tintable-idle", 100, parentGroup, 1, color);

        // Temp fix: move the health bar above the shadow/light layer
        game.globals.groups.foreground.add(this._healthBar);

        this._movementComponent = null;
        this._inGhostMode = false;

        this._damage = 10; // 10 units per second

        // If there wasn't a shieldColor provided, set the shieldColor and shield to null.
        if (!shieldColor) {
            this._shieldColor = null;
            this._shield = null;
        } else {
            // If a shieldColor param was provided, you want a shield!
            // Add the shield as a child sprite of the shadow enemy.
            this._shield = game.add.sprite(0, 0, "assets", "shadow-enemy/outline");
            this._shield.anchor.set(0.5);
            // Also tint the shield based on the shield color!
            this._shieldColor = shieldColor instanceof Color ? shieldColor : new Color(shieldColor);
            this._shield.tint = this._shieldColor.getRgbColorInt();
            this.addChild(this._shield);
        }

        // Override from BaseEnemy
        const diameter = 0.1 * this.width; // Fudge factor - body smaller than sprite
        this.body.setCircle(diameter / 2, (this.width - diameter) / 2, 
            (this.height - diameter) / 2);
        this.body.collideWorldBounds = true;
        this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);

        this.body.angularVelocity = this.game.rnd.sign() *
            this.game.rnd.realInRange(25, 35);

        this._dieSound = this.game.globals.soundManager.add("pop");
        this._dieSound.playMultiple = true;
        
        // If the level has changed, make sure the enemy is not inside of a wall
        this._levelManager = game.globals.levelManager;
        this._levelManager.levelChangeSignal.add(this._checkCollision, this);

        this._timer = game.time.create(false);
        this._timer.start();
    }

    _checkCollision() {
        const wallLayer = this._levelManager.getCurrentWallLayer();

        // Get all colliding tiles that are within range and destroy if there are any
        const pad = 0;
        const tiles = wallLayer.getTiles(
            this.position.x - pad, this.position.y - pad,
            this.width + pad, this.height + pad, 
            true
        );
        if (tiles.length > 0) this.destroy();
    }

    update() {
        // If the enemy hasn't spawned yet, don't move or attack!
        if (!this._spawned) return;

        // Collisions with the tilemap
        const lm = this.game.globals.levelManager;
        this.game.physics.arcade.collide(this, lm.getCurrentWallLayer());

        // Switching into or out of ghost mode
        if (this._player.ghostMode && !(this._movementComponent instanceof AvoidComp)) {
            const dist = this._player.position.distance(this.position);
            if (dist < 300) {
                const speed = this._movementComponent ? this._movementComponent.speed : 100;
                this.setMovementComponent(new AvoidComp(this, this._player, speed));
                this._inGhostMode = true;
            }
        } else if (this._inGhostMode && !this._player.ghostMode) {
            const speed = this._movementComponent ? this._movementComponent.speed : 100;
            this.setMovementComponent(new TargetingComp(this, speed));
            this._inGhostMode = false;
        }

        if (this._movementComponent) this._movementComponent.update();
        super.update();
    }

    destroy(...args) {
        this._timer.destroy();
        this._levelManager.levelChangeSignal.remove(this._checkCollision, this);
        this._dieSound.play();

        if (this._movementComponent) this._movementComponent.destroy();
        super.destroy(...args);
    }

    setMovementComponent(newComponent) {
        if (this._movementComponent) this._movementComponent.destroy();
        this._movementComponent = newComponent;
    }

    getMovementComponent() {
        return this._movementComponent;
    }
}

module.exports = ShadowEnemy;