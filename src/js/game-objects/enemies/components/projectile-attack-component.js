import EnemyProjectile from "../enemy-projectile";

export default class ProjectileAttackComponent {
  constructor(parent, targetingComponent) {
    this.game = parent.game;
    this.parent = parent;
    this._targetingComponent = targetingComponent;
    this.projectileGroup = this.game.add.group(
      this.game.globals.groups.midground,
      "enemy-projectiles"
    );
    this._timer = this.game.time.create(false);
    this._timer.start();
    this._fireDelay = 1000;
    this._canFire = true;
  }

  update() {
    const target = this._targetingComponent.target;
    if (target._playerLight.isPointInShadow(this.parent.position)) {
      this._targetingComponent.isActive = true;
      return;
    }

    this._targetingComponent.isActive = false;
    if (this._canFire) {
      const angle = this.parent.position.angle(target.position);
      const { game, parent, projectileGroup } = this;
      new EnemyProjectile(game, parent.x, parent.y, projectileGroup, target, angle, 300);
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
