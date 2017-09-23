import Color from "../../helpers/color";
import HealthBar from "./components/health-bar.js";
import TargetingComp from "./components/targeting-component";

export default class Enemy extends Phaser.Sprite {
  static MakeBig(game, position, enemyGroup) {
    const enemy = new Enemy(game, "assets", "enemies/arrow-big", position, enemyGroup, {
      color: Color.blue(),
      health: 500,
      speed: 50
    });
    return enemy;
  }

  static MakeSmall(game, position, enemyGroup) {
    const enemy = new Enemy(game, "assets", "enemies/arrow-small", position, enemyGroup, {
      color: Color.red(),
      health: 100,
      speed: 100
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
    game.physics.arcade.enable(this);
    const diameter = 0.2 * this.width; // Fudge factor - body smaller than sprite
    this.body.setCircle(diameter / 2, (this.width - diameter) / 2, (this.height - diameter) / 2);
    this.body.collideWorldBounds = true;
    this.satBody = this.game.globals.plugins.satBody.addCircleBody(this);
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
