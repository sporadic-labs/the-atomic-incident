import { satSpriteVsTilemap, checkOverlapWithGroup } from "../../helpers/sprite-utilities";

export default class BaseProjectile extends Phaser.Sprite {
  constructor(game, x, y, key, frame, parentGroup, player, damage, angle, speed) {
    super(game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._damage = damage;
    this._speed = speed;
    this._initialPos = this.position.clone();
    this._remove = false; // check if BaseProjectile should be removed?

    // NOTE(rex): We need to rotate 90 degrees on setup for it to be oriented correctly.
    this.rotation = angle + Math.PI / 2; // Radians

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(
      angle * 180 / Math.PI,
      this._speed,
      this.body.velocity
    );

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);

    // Make sure the projectile isn't spawning in a wall
    satSpriteVsTilemap(
      this,
      this.game.globals.mapManager.wallLayer,
      this._onCollideWithMap,
      this,
      6
    );
  }

  update() {
    // Collisions with the tilemap
    satSpriteVsTilemap(
      this,
      this.game.globals.mapManager.wallLayer,
      this._onCollideWithMap,
      this,
      6
    );
  }

  postUpdate() {
    // Update arcade physics
    Phaser.Sprite.prototype.postUpdate.apply(this, arguments);
    // Check overlap
    checkOverlapWithGroup(this, this._enemies, this._onCollideWithEnemy, this);
    // If bullet is in shadow, or has travelled beyond the radius it was allowed, destroy it.
    if (this._player._playerLight.isPointInShadow(this.position)) {
      this.destroy();
    }
  }

  destroy() {
    Phaser.Sprite.prototype.destroy.apply(this, arguments);
  }

  // eslint-disable-next-line no-unused-vars
  _onCollideWithMap(self, map) {
    this.destroy();
  }

  _onCollideWithEnemy(self, enemy) {
    if (enemy._spawned) {
      enemy.takeDamage(this._damage);
    }
    // TODO(rex): Combos?
    // if (isKilled) this._player.incrementCombo(1);
    this.destroy();
  }
}
