const prefix = "weapons/explosion/explosion-";

export default class Explosion extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @constructor
   */
  constructor(game, x, y, parent, damage) {
    super(game, x, y, "assets", `${prefix}00000`);
    this.anchor.set(0.5);
    parent.add(this);

    this.damage = damage;

    this.enemies = game.globals.groups.enemies;

    const frames = Phaser.Animation.generateFrameNames(prefix, 0, 17, "", 5);
    this.animations.add("explode", frames, 24, false).onComplete.add(() => this.destroy());
    this.animations.play("explode");

    game.physics.sat.add.gameObject(this).setCircle(0);
    game.physics.sat.add.overlap(this, this.enemies, {
      onCollide: (_, enemy) => this.onCollideWithEnemy(enemy)
    });

    const tweenTarget = { radius: 0 };
    game.tweens
      .create(tweenTarget)
      .to({ radius: this.width / 2 }, 10 / 24 * 1000)
      .onUpdateCallback(() => this.body.setCircle(tweenTarget.radius))
      .start();

    this.alpha = 0.9;

    this.enemiesDamaged = [];
  }

  onCollideWithEnemy(enemy) {
    if (!this.enemiesDamaged.includes(enemy)) {
      const d = this.position.distance(enemy.position);
      // MH: this is scaling by distance to center of enemy, that's not exactly what we want, but
      // close enough for now.
      const scaledDamage = Phaser.Math.mapLinear(d, 0, this.width / 2, this.damage, 0);
      enemy.takeDamage(scaledDamage, this);
      this.enemiesDamaged.push(enemy);
    }
  }
}
