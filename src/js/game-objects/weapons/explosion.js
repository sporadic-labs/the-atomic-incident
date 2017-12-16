import { checkOverlapWithGroup } from "../../helpers/sprite-utilities";

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

    this.game.physics.arcade.enable(this);

    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);
    this.satBody.setCircleRadius(0);

    const tweenTarget = { radius: 0 };
    game.tweens
      .create(tweenTarget)
      .to({ radius: this.width / 2 }, 10 / 24 * 1000)
      .onUpdateCallback(() => this.satBody.setCircleRadius(tweenTarget.radius))
      .start();

    this.alpha = 0.9;

    this.enemiesDamaged = [];
  }

  update() {
    checkOverlapWithGroup(this, this.enemies, (_, enemy) => {
      if (!this.enemiesDamaged.includes(enemy)) {
        enemy.takeDamage(this.damage, this);
        this.enemiesDamaged.push(enemy);
      }
    });
  }
}
