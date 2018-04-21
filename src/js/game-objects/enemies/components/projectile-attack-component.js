import EnemyProjectile from "../enemy-projectile";

export default class ProjectileAttackComponent {
  constructor(parent, targetingComponent) {
    this.game = parent.game;
    this.parent = parent;
    this.projectileGroup = this.game.add.group(this.game.globals.groups.midground);
    this._targetingComponent = targetingComponent;
    this._difficultyModifier = this.game.globals.difficultyModifier;

    this._fireSound = this.game.globals.soundManager.add("enemy-shoot", null, 1);

    this._timer = this.game.time.create(false);
    this._timer.start();
    this._fireDelay = 1000;
    this._canFire = true;

    this._isInLight = false;
    this._enteredLightAt = 0;
  }

  /**
   * Check if the parent has been in the light for the specified duration
   * @param {number} duration Time in ms
   */
  hasBeenInLightFor(duration) {
    const player = this._targetingComponent.target;
    const wasInLight = this._isInLight;
    this._isInLight = !player._playerLight.isPointInShadow(this.parent.position);
    if (this._isInLight && !wasInLight) this._enteredLightAt = this._timer.ms;
    return this._isInLight && this._timer.ms - this._enteredLightAt > duration;
  }

  update() {
    const player = this._targetingComponent.target;
    if (!this.hasBeenInLightFor(250)) {
      this._targetingComponent.isActive = true;
      return;
    }

    this._targetingComponent.isActive = false;
    if (this._canFire) {
      const angle = this.parent.position.angle(player.position);
      const { game, parent, projectileGroup } = this;
      const speed = 300 * this._difficultyModifier.getSpeedMultiplier();
      this._fireSound.play();
      new EnemyProjectile(game, parent.x, parent.y, projectileGroup, player, angle, speed);
      this._canFire = false;
      this._timer.add(this._fireDelay, () => {
        this._canFire = true;
      });
    }
  }

  destroy() {
    this._timer.destroy();
  }
}
