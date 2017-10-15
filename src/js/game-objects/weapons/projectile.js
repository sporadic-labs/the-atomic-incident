import { satSpriteVsTilemap, checkOverlapWithGroup } from "../../helpers/sprite-utilities";

export default class Projectile extends Phaser.Sprite {
  static makePiercing(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/slug";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new PiercingCollisionLogic(bullet, damage));
    return bullet;
  }

  static makeBullet(game, x, y, parent, player, damage, angle, speed) {
    const key = "assets";
    const frame = "weapons/slug";
    const bullet = new Projectile(game, x, y, key, frame, parent, player, angle, speed);
    bullet.init(new CollisionLogic(bullet, damage));
    return bullet;
  }

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
    this._collisionLogic = logic;
    satSpriteVsTilemap(this, this._wallLayer, logic.onCollideWithWall, logic, 6);
  }

  update() {
    const logic = this._collisionLogic;
    satSpriteVsTilemap(this, this._wallLayer, logic.onCollideWithWall, logic, 6);
  }

  postUpdate(...args) {
    super.postUpdate(...args); // Update arcade physics
    const logic = this._collisionLogic;
    checkOverlapWithGroup(this, this._enemies, (_, enemy) => logic.onCollideWithEnemy(enemy));
    // If bullet is in shadow, or has travelled beyond the radius it was allowed, destroy it.
    if (this._player._playerLight.isPointInShadow(this.position)) this.destroy();
  }
}

/**
 * Base class for handling projectile collision with enemies and walls. The default logic is that a
 * projectile is destroyed on colliding with something. 
 * 
 * @class CollisionLogic
 */
class CollisionLogic {
  constructor(projectile, damage) {
    this._projectile = projectile;
    this._damage = damage;
  }
  onCollideWithEnemy(enemy) {
    if (enemy._spawned) enemy.takeDamage(this._damage);
    this._projectile.destroy();
  }
  onCollideWithWall() {
    this._projectile.destroy();
  }
}

class PiercingCollisionLogic extends CollisionLogic {
  constructor(projectile, damage) {
    super(projectile, damage);
    this._enemiesDamaged = [];
  }

  onCollideWithEnemy(enemy) {
    if (enemy._spawned && !this._enemiesDamaged.includes(enemy)) {
      enemy.takeDamage(this._damage);
      this._enemiesDamaged.push(enemy);
    }
  }
}
