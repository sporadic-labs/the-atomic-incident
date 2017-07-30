import SpriteUtils from "../../helpers/sprite-utilities";

export default class BaseProjectile extends Phaser.Sprite {
    constructor(game, x, y, key, frame, parentGroup, player, damage,
    angle, speed) {
        super(game, x, y, key, frame);
        this.anchor.set(0.5);
        parentGroup.add(this);

        this._player = player;
        this._enemies = game.globals.groups.enemies;
        this._damage = damage;
        this._speed = speed;
        this._initialPos = this.position.clone();
        this._remove = false; // check if BaseProjectile should be removed?

        // NOTE(rex): We need to rotate this sprite 90 degrees on setup for it to be oriented correctly.
        this.rotation = angle + (Math.PI / 2); // Radians

        this.game.physics.arcade.enable(this);
        this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, 
            this._speed, this.body.velocity);
        
        this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);

        // Make sure the projectile isn't spawning in a wall
        SpriteUtils.satSpriteVsTilemap(this, this.game.globals.levelManager.getCurrentWallLayer(), 
            this._onCollideWithMap, this, 6);
    }

    update() {
        // Collisions with the tilemap
        SpriteUtils.satSpriteVsTilemap(this, this.game.globals.levelManager.getCurrentWallLayer(), 
            this._onCollideWithMap, this, 6);
    }

    postUpdate () {
        // Update arcade physics
        Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
        // Check overlap
        SpriteUtils.checkOverlapWithGroup(this, this._enemies, 
            this._onCollideWithEnemy, this);
    }

    destroy () {
        Phaser.Sprite.prototype.destroy.apply(this, arguments);
    }

    // eslint-disable-next-line no-unused-vars
    _onCollideWithMap (self, map) {
        if (self._isDestructable) {
            self._remove = true;
        }
    }

    _onCollideWithEnemy (self, enemy) {
        var isKilled = enemy.takeDamage(this._damage);
        // TODO(rex): Combos?
        // if (isKilled) this._player.incrementCombo(1);
        if (self._isDestructable && !self._canPierce) {
            self._remove = true;
        }
    }
}