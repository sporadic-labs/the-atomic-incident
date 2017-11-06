import Color from "../../helpers/color";
import HealthBar from "./components/health-bar.js";
import TargetingComp from "./components/targeting-component";
import SAT from "sat";
import { debugShape } from "../../helpers/sprite-utilities";

export default class Enemy extends Phaser.Sprite {
  static MakeTestEnemy(game, key, position, enemyGroup) {
    const enemy = new Enemy(game, "assets", key, position, enemyGroup, {
      health: 100,
      speed: 100,
      visionRadius: null
    });
    return enemy;
  }

  constructor(
    game,
    key,
    frame,
    position,
    enemyGroup,
    { health = 100, color = 0xffffff, speed = 100, visionRadius = 200 } = {}
  ) {
    super(game, position.x, position.y, key, frame);
    this.anchor.set(0.5);

    this._movementComponent = new TargetingComp(this, speed, visionRadius);

    const colorObj = color instanceof Color ? color : new Color(color);
    this.tint = colorObj.getRgbColorInt();

    const cx = 0;
    const cy = this.height / 2 + 4;
    const fg = game.globals.groups.foreground; // Temp fix: move health above the shadows
    this._healthBar = new HealthBar(game, this, fg, cx, cy, 20, 4);
    this._healthBar.initHealth(health);

    this._spawned = false; // use check if the enemy is fully spawned!
    const tween = this.game.make
      .tween(this)
      .to({ alpha: 0.25 }, 200, "Quad.easeInOut", true, 0, 2, true);
    // When tween is over, set the spawning flag to false
    tween.onComplete.add(() => (this._spawned = true));

    this._dieSound = this.game.globals.soundManager.add("pop");
    this._dieSound.playMultiple = true;

    enemyGroup.addEnemy(this);

    // Config arcade and SAT body physics
    // - Arcade physics hitbox is small. It is used to allow enemies to move without jostling one
    //   another and to be conservative when checking if enemy has reached the player.
    // - SAT body hitbox is used for the bullet to be liberal with determining when a bullet has hit
    //   an enemy
    game.physics.arcade.enable(this);
    // const diameter = 0.2 * this.width; // Fudge factor - body smaller than sprite
    const diameter = 1 * this.width; // Temp
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);
    this.body.collideWorldBounds = true;
    // Counter-clockwise points defined in pixel coordinates of 45 x 45 pixel image, then scaled to
    // the current image dimensions and shifted relative to the origin. Hacky for now.
    const points = [{ x: 22.5, y: 8 }, { x: 36, y: 40 }, { x: 8, y: 40 }].map(p => ({
      x: p.x / 45 * this.width - this.width / 2,
      y: p.y / 45 * this.height - this.height / 2
    }));
    this.satBody = this.game.globals.plugins.satBody.addPolygonBody(this, points);
  }

  takeDamage(damage) {
    const newHealth = this._healthBar.incrementHealth(-damage);
    if (newHealth <= 0) {
      this.destroy();
      return true;
    }
    return false;
  }

  update() {
    if (!this._spawned) return; // If the enemy hasn't spawned yet, don't move or attack!
    this._movementComponent.update();
    super.update();
  }

  postUpdate(...args) {
    // Post updates are where movement physics are applied. We want all post updates to finish
    // BEFORE placing extracting the sprite's position
    super.postUpdate(...args);
    // Now extract sprite position and apply it to the group
    this._healthBar.updatePosition();
  }

  destroy(...args) {
    this.game.tweens.removeFrom(this);
    this._healthBar.destroy();
    this._movementComponent.destroy();
    super.destroy(...args);
  }
}
