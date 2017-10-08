export class RadarIndicator extends Phaser.Group {
  constructor(game, parent, player, target, minScale = 0.1, angleOffset = Math.PI / 2) {
    super(game, parent, "RadarIndicator");

    this._player = player;
    this._target = target;
    this._angleOffset = angleOffset;
    this._maxDistance = Math.sqrt(Math.pow(this.game.width, 2) + Math.pow(this.game.height, 2));
    this._minScale = minScale;
  }

  getTarget() {
    return this._target;
  }

  updatePlacement(radiusOffset = 5) {
    const playerLight = this._player._playerLight;
    if (playerLight._light.isPointInLight(this._target.position)) {
      this.visible = false;
    } else {
      this.visible = true;
      const dist = this._player.position.distance(this._target);
      const lightRadius = playerLight.getRadius();
      this._updatePosition(dist, lightRadius, radiusOffset);
      this._updateRotation(this._angleOffset);
      this._updateScale(dist, lightRadius);
    }
  }

  _updatePosition(playerDistance, lightRadius, radiusOffset) {
    // Update position
    if (playerDistance < lightRadius) {
      // Target is behind a wall, so place icon directly over target
      this.position.copyFrom(this._target.position);
    } else {
      // Target is in the shadow, but not behind a wall, so place the icon around the light's edge
      const angle = this._player.position.angle(this._target.position);
      this.position.set(
        this._player.position.x + (lightRadius + radiusOffset) * Math.cos(angle),
        this._player.position.y + (lightRadius + radiusOffset) * Math.sin(angle)
      );
    }
  }

  _updateRotation(offset) {
    const angle = this._player.position.angle(this._target.position);
    this.rotation = angle + offset;
  }

  _updateScale(distance, lightRadius) {
    if (distance <= lightRadius) {
      // Cap the max size at 1 when target is within light
      this.scale.setTo(1);
    } else {
      // Scale the size based on distance from the edge of the light radius
      const fraction = 1 - (distance - lightRadius) / (this._maxDistance - lightRadius);
      const scale = Phaser.Math.mapLinear(fraction, 0, 1, this._minScale, 1);
      this.scale.setTo(scale);
    }
  }
}

export class EnemyIndicator extends RadarIndicator {
  constructor(game, parent, player, enemy) {
    super(game, parent, player, enemy);
    const arrow = game.make.image(0, 0, "assets", "hud/targeting-arrow");
    arrow.anchor.set(0.5);
    arrow.tint = enemy.tint;
    this.add(arrow);
    this.updatePlacement();
  }
}

export class GoalIndicator extends RadarIndicator {
  constructor(game, parent, player, target) {
    super(game, parent, player, target, 0.5);

    const pointer = this.game.make.sprite(0, 0, "assets", "hud/goal-indicator");
    pointer.anchor.set(20 / 40, 24 / 40); // Center of asset expressed as fraction of image size
    pointer.rotation = Math.PI / 4;
    this.add(pointer);
    this._pointer = pointer;

    const box = this.game.make.sprite(0, 0, "assets", "pickups/box");
    box.scale.set(16 / 25); // Scale expressed as fraction of image size
    box.anchor.set(0.5);
    this.add(box);
  }

  _updatePosition(playerDistance, lightRadius, radiusOffset) {
    const angle = this._player.position.angle(this._target.position);
    if (playerDistance < lightRadius) {
      // Target is behind a wall, so place icon slightly behind the target
      this.position.set(
        this._target.position.x + 25 * Math.cos(angle),
        this._target.position.y + 25 * Math.sin(angle)
      );
    } else {
      // Target is in the shadow, but not behind a wall, so place the icon around the light's edge
      this.position.set(
        this._player.position.x + (lightRadius + radiusOffset) * Math.cos(angle),
        this._player.position.y + (lightRadius + radiusOffset) * Math.sin(angle)
      );
    }
  }

  _updateRotation(offset) {
    const angle = this.position.angle(this._target.position);
    this._pointer.rotation = angle + offset;
  }
}
