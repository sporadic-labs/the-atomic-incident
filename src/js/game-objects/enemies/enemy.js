import Color from "../../helpers/color";
import HealthBar from "./components/health-bar.js";
import TargetingComp from "./components/targeting-component";
import { debugShape } from "../../helpers/sprite-utilities";
import FlashSilhouetteFilter from "./components/flash-silhouette-filter";
import { ENEMY_INFO } from "./enemy-info";

export default class Enemy extends Phaser.Sprite {
  static MakeEnemyType(game, type, position, enemyGroup) {
    const info = ENEMY_INFO[type] || {};
    const key = info.key || "";
    const enemy = new Enemy(game, "assets", key, position, enemyGroup, {
      health: 100,
      speed: 160,
      visionRadius: null,
      collisionPoints: info.collisionPoints || []
    });
    return enemy;
  }

  constructor(
    game,
    key,
    frame,
    position,
    enemyGroup,
    { health = 100, color = 0xffffff, speed = 100, visionRadius = 200, collisionPoints = [] } = {}
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

    this._hitSound = this.game.globals.soundManager.add("squish-impact-faster", 5);
    this._deathSound = this.game.globals.soundManager.add("squish");
    enemyGroup.addEnemy(this);
    this.enemyGroup = enemyGroup;

    // Config arcade and SAT body physics
    // - Arcade physics hitbox is small. It is used to allow enemies to move without jostling one
    //   another and to be conservative when checking if enemy has reached the player.
    // - SAT body hitbox is used for the bullet to be liberal with determining when a bullet has hit
    //   an enemy
    game.physics.arcade.enable(this);
    // const diameter = 0.2 * this.width; // Fudge factor - body smaller than sprite
    const diameter = 0.5 * this.width; // Temp
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);
    this.body.collideWorldBounds = true;
    // Counter-clockwise points (in range [0, 1]) need to be shifted so that the center is in the
    // middle of the graphic and then scaled to match sprite's scale.
    const points = collisionPoints.map(p => ({
      x: (p[0] - 0.5) * this.width,
      y: (p[1] - 0.5) * this.height
    }));
    this.satBody = this.game.globals.plugins.satBody.addPolygonBody(this, points);

    this._flashFilter = new FlashSilhouetteFilter(game);
    this.filters = [this._flashFilter];
  }

  takeDamage(damage, projectile) {
    const newHealth = this._healthBar.incrementHealth(-damage);
    this._flashFilter.startFlash();
    if (newHealth <= 0) {
      if (projectile && projectile.body) {
        // Bugs: sometimes projectile is destroyed before the enemy. Also need to handle player dash
        const angle = Math.atan2(projectile.body.velocity.y, projectile.body.velocity.x);
        this.enemyGroup.emitDeathParticles(projectile.position, angle);
      }
      this._deathSound.play();
      this.destroy();
      return true;
    }
    this._hitSound.play();
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
