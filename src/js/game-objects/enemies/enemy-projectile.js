import { satSpriteVsTilemap } from "../../helpers/sprite-utilities";

/**
 * @class Projectile
 */
export default class EnemyProjectile extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @constructor
   */
  constructor(game, x, y, parent, player, angle, speed) {
    super(game, x, y, "assets", "enemies/virus/virus-bullet");
    this.anchor.set(0.5);
    parent.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._wallLayer = this.game.globals.mapManager.wallLayer;

    this.rotation = angle + Math.PI / 2;

    this.game.physics.arcade.enable(this);
    this.body.setCircle(2.5, 0, 0);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);
  }

  update() {
    satSpriteVsTilemap(this, this._wallLayer, () => {
      this.destroy();
      // Wall sound goes here
      return true; // Don't check against any other walls within this frame
    });
  }

  postUpdate(...args) {
    super.postUpdate(...args); // Update arcade physics

    // Not a complete fix, but cap the xy velocity by magnitude to achieve consistent speed
    if (this.body.velocity.getMagnitude() > this.body.maxVelocity.x) {
      this.body.velocity.setMagnitude(this.body.maxVelocity.x);
    }

    if (this.satBody.testOverlap(this._player.satBody)) {
      this._player.takeDamage();
      this.destroy();
    }
  }
}
