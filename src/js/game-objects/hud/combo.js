import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#FFEB6E"
};

/**
 * TODO: scaling text looks pretty bad in v3
 */
export default class Combo {
  constructor(scene, hudContainer, player, enemyGroup) {
    this.scene = scene;
    this.comboMultiplier = 1;

    this.text = scene.add.text(0, 0, "", style).setOrigin(0.5, 0.5);
    hudContainer.add(this.text);

    // player.onDamage.add(this.resetCombo, this);
    // enemyGroup.onEnemyKilled.add(() => this.incrementCombo(0.1));
    this.updateDisplay();
  }

  getCombo() {
    return this.comboMultiplier;
  }

  resetCombo() {
    this.comboMultiplier = 1;
    this.updateDisplay();
  }

  incrementCombo(increment) {
    this.comboMultiplier += increment;
    this.updateDisplay();
  }

  updatePosition() {
    // Combo text is anchored at (0.5, 0.5) for a scaling tween, but we want to position the group
    // via an anchor of (1, 0) so that we can align it against the right edge of the screen.
    const width = this.scene.sys.game.config.width;
    this.text.x = width - 5 - 0.5 * this.text.width;
    this.text.y = 32 + 0.5 * this.text.height;
  }

  updateDisplay() {
    this.text.setVisible(this.comboMultiplier > 1).setText(`${this.comboMultiplier.toFixed(1)}x`);
    this.updatePosition();

    if (this.timeline) this.timeline.destroy();
    this.timeline = this.scene.tweens
      .createTimeline()
      .add({
        targets: this.text,
        scaleY: { value: 1.1, duration: 100, ease: "Bounce.easeOut" },
        scaleX: { value: 1.1, duration: 200, ease: "Bounce.easeOut" }
      })
      .add({
        targets: this.text,
        scaleY: { value: 1, duration: 100, ease: "Bounce.easeOut" },
        scaleX: { value: 1, duration: 200, ease: "Bounce.easeOut" }
      });
    this.timeline.play();
  }

  destroy() {
    if (this.timeline) this.timeline.destroy();
    this.text.destroy();
  }
}
