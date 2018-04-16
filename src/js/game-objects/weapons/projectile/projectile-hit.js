const prefix = "weapons/hit/";

// TODO(rex): Make this more flexible.
export default class ProjectileHit extends Phaser.Sprite {
  /**
   * @param {Phaser.Game} game - Reference to Phaser.Game.
   * @param {string} key - Key for sprite in asset sheet.
   * @param {string} frame - Frame for sprite in asset sheet.
   * @param {number} x - X coordinate in world position.
   * @param {number} y - Y coordinate in world position.
   * @param {Phaser.Group} parent - Phaser.Group that stores this projectile.
   * @constructor
   */
  constructor(game, x, y, parent) {
    super(game, x, y, "assets", `${prefix}00`);
    this.anchor.set(0.5);
    parent.add(this);

    const frames = Phaser.Animation.generateFrameNames(prefix, 0, 11, "", 2);
    this.animations.add("bullet-hit", frames, 30, false).onComplete.add(() => this.destroy());
    this.animations.play("bullet-hit");

    this.rotation += game.rnd.integerInRange(0, 90) * (Math.PI / 180) * game.rnd.sign();

    this.alpha = 0.9;
  }

  destroy(...args) {
    super.destroy(...args);
  }
}
