import { satSpriteVsTilemap, checkOverlapWithGroup } from "../../../helpers/sprite-utilities";
import { CollisionLogic, ExplodingCollisionLogic, PiercingCollisionLogic } from "./collision-logic";

/**
 * @class Projectile
 */
export default class Projectile extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeRocket(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/rocket_15";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new ExplodingCollisionLogic(bullet, damage));
    if (bullet.game) {
      bullet.body.velocity.setTo(Math.cos(angle) * speed / 10, Math.sin(angle) * speed / 10);
      bullet.body.acceleration.setTo(Math.cos(angle) * 1000, Math.sin(angle) * 1000);
      bullet.body.maxVelocity.setTo(speed);
    }
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makePiercing(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/machine_gun_15";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new PiercingCollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeSlug(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/slug";
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeScatterShot(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/shotgun_15";
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeHomingShot(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/tracking_15";
    return this.makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed);
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @static
   */
  static makeBullet(game, key, frame, x, y, parent, player, damage, angle, speed) {
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new CollisionLogic(bullet, damage));
    return bullet;
  }

  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @param {Player} player - Reference to Player.
   * @param {number} damage - Damage value.
   * @param {number} angle - Angle in radians.
   * @param {number} speed - Speed.
   * @constructor
   */
  constructor(game, x, y, key, frame, parent, player, angle, speed) {
    super(game, x, y, key, frame);
    this.anchor.set(0.5);
    parent.add(this);

    this._player = player;
    this._enemies = game.globals.groups.enemies;
    this._wallLayer = this.game.globals.mapManager.wallLayer;

    this.rotation = angle + Math.PI / 2;

    this.game.physics.arcade.enable(this);
    this.game.physics.arcade.velocityFromAngle(angle * 180 / Math.PI, speed, this.body.velocity);

    this.satBody = this.game.globals.plugins.satBody.addBoxBody(this);
  }

  /**
   * Initialize the logic and ensure the projectile isn't inside a wall to start
   * 
   * @param {any} logic 
   * @memberof Projectile
   */
  init(logic) {
    this.collisionLogic = logic;
    satSpriteVsTilemap(this, this._wallLayer, logic.onCollideWithWall, logic, 6);
  }

  update() {
    const logic = this.collisionLogic;
    satSpriteVsTilemap(this, this._wallLayer, logic.onCollideWithWall, logic, 6);
  }

  postUpdate(...args) {
    super.postUpdate(...args); // Update arcade physics

    // Not a complete fix, but cap the xy velocity by magnitude to achieve consistent speed
    if (this.body.velocity.getMagnitude() > this.body.maxVelocity.x) {
      this.body.velocity.setMagnitude(this.body.maxVelocity.x);
    }

    const logic = this.collisionLogic;
    checkOverlapWithGroup(this, this._enemies, (_, enemy) => logic.onCollideWithEnemy(enemy));

    // If bullet is in shadow, or has travelled beyond the radius it was allowed, destroy it.
    if (this._player._playerLight.isPointInShadow(this.position)) this.destroy();
  }
}
