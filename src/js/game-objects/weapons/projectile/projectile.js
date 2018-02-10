import {
  CollisionLogic,
  ExplodingCollisionLogic,
  PiercingCollisionLogic,
  BouncingCollisionLogic
} from "./collision-logic";

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
      bullet.body.setMaxSpeed(speed);
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
  static makeFlame(game, x, y, parent, player, damage, angle, speed, maxAge, color) {
    const key = "assets";
    const frame = "weapons/tracking_15";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.tint = color;
    bullet._setDeathTimer(maxAge);
    // Flames get a randomized drag to slow the bullets over time.
    bullet.body.setDrag(game.rnd.realInRange(0.5, 0.99));
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
  static makeBouncing(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/shotgun_15";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.body.setBounce(1);
    bullet.init(new BouncingCollisionLogic(bullet, damage));
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

    this.deathTimer;

    game.physics.sat.add
      .gameObject(this)
      .setCircle(this.width / 2)
      .setVelocity(speed * Math.cos(angle), speed * Math.sin(angle));
  }

  /**
   * Initialize the logic and ensure the projectile isn't inside a wall to start
   *
   * @param {any} logic
   * @memberof Projectile
   */
  init(logic) {
    this.collisionLogic = logic;
    if (this.game.physics.sat.world.collide(this, this._wallLayer)) this.destroy();
  }

  update() {
    this.collisionLogic.onBeforeCollisions();

    this.game.physics.sat.world.collide(this, this._wallLayer, {
      onCollide: () => this.collisionLogic.onCollideWithWall()
    });
    if (!this.game) return;

    this.game.physics.sat.world.overlap(this, this._enemies, {
      onCollide: (_, enemy) => this.collisionLogic.onCollideWithEnemy(enemy)
    });
    if (!this.game) return;

    this.collisionLogic.onAfterCollisions();

    // If the bullet isn't moving, destroy it.
    if (this.body && this.body.velocity.getMagnitude() <= 0) {
      this.destroy();
    }
  }

  postUpdate(...args) {
    super.postUpdate(...args); // Update arcade physics

    // If bullet is in shadow, or has travelled beyond the radius it was allowed, destroy it.
    if (this._player._playerLight.isPointInShadow(this.position)) this.destroy();
  }

  _setDeathTimer(maxAge) {
    this.deathTimer = setTimeout(() => {
      this.destroy();
    }, maxAge);
  }

  /**
   * Cleanup functions for this Sprite.
   */
  destroy() {
    if (this.deathTimer) {
      clearTimeout(this.deathTimer);
    }
    super.destroy();
  }
}
