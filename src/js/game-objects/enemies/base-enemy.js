import Color from "../../helpers/color";
import HealthBar from "./components/health-bar.js";

export default class BaseEnemy extends Phaser.Sprite {
  constructor(game, x, y, key, frame, health, parentGroup, pointValue = 1, color) {
    super(game, x, y, key, frame);
    this.anchor.set(0.5);
    parentGroup.add(this);

    this._player = this.game.globals.player;
    this._spawnPickups = this.game.globals.spawnPickups;
    this._pointValue = pointValue;

    // Tint the enemy based on the color
    this.color = color instanceof Color ? color : new Color(color);
    this.tint = this.color.getRgbColorInt();

    // Health bar
    const cx = 0;
    const cy = this.height / 2 + 4;
    this._healthBar = new HealthBar(game, this, parentGroup, cx, cy, 20, 4);
    this._healthBar.initHealth(health);

    // Register Enemies with the HUD for tracking
    this.game.globals.hud.radar.registerEnemy(this);

    this._spawned = false; // use check if the enemy is fully spawned!
    const tween = this.game.make
      .tween(this)
      .to({ alpha: 0.25 }, 200, "Quad.easeInOut", true, 0, 2, true);
    // When tween is over, set the spawning flag to false
    tween.onComplete.add(() => (this._spawned = true));

    // Configure simple physics
    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = false;
  }

  takeDamage(damage) {
    const newHealth = this._healthBar.incrementHealth(-damage);
    if (newHealth <= 0) {
      this.game.globals.hud.radar.removeEnemy(this);
      this.destroy();
      return true;
    }
    return false;
  }

  postUpdate(...args) {
    // Post updates are where movement physics are applied. We want all post
    // updates to finish BEFORE placing extracting the sprite's position
    super.postUpdate(...args);
    // Now extract sprite position and apply it to the group
    this._healthBar.updatePosition();
  }

  destroy(...args) {
    // Update the comboTracker
    this.game.globals.comboTracker.incrementCombo(1, 0.2);
    // And destroy this enemy
    this.game.tweens.removeFrom(this);
    this._healthBar.destroy();
    super.destroy(...args);
  }
}
