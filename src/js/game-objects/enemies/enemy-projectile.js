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

    game.physics.sat.add
      .gameObject(this)
      .setCircle(this.width / 2)
      .setVelocity(speed * Math.cos(angle), speed * Math.sin(angle));

    game.physics.sat.add.overlap(this, this._wallLayer, {
      onCollide: this.onCollideWithWall,
      context: this
    });

    game.physics.sat.add.overlap(this, this._player, {
      onCollide: this.onCollideWithPlayer,
      context: this
    });
  }

  onCollideWithWall() {
    this.destroy();
  }

  onCollideWithPlayer() {
    this._player.takeDamage();
    this.destroy();
  }
}
