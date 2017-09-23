/**
 * Player Radar. Keep track of enemy position.  Display an arrow pointing in their general
 * direction, relative to the player light. If the enemy is in light, no need for the arrow.  Use
 * your eyes!
 * 
 * @class Radar
 */
export default class Radar {
  /**
   * @param {Phaser.Game} game
   */
  constructor(game, enemyGroup) {
    this.game = game;

    enemyGroup.onEnemyAdded.add(enemy => this.registerEnemy(enemy));
    enemyGroup.onEnemyKilled.add(enemy => this.removeEnemy(enemy));
    this._trackedEnemies = [];
  }

  /**
   * Update the position and rotation of each enemy registered with the radar.
   * 
   * @memberof Radar
   */
  update() {
    const player = this.game.globals.player;

    // Update Enemy Trackers
    for (const { enemy, tracker } of this._trackedEnemies) {
      // If the enemy is in light, hide this tracker.
      if (player._playerLight._light.isPointInLight(enemy.position)) {
        tracker.visible = false;
      } else {
        // If the enemy is in the dark, show the arrow an update it's position.
        tracker.visible = true;
        // Position
        const { x: cX, y: cY } = this._getTrackerPosition(enemy);
        tracker.position.copyFrom(new Phaser.Point(cX, cY));
        // Rotation
        const angle = player.position.angle(enemy.position);
        tracker.rotation = angle + Math.PI / 2;
        // Scale
        const scale = this._getTrackerScale(enemy);
        tracker.scale.setTo(scale, scale);
      }
    }
  }

  /**
   * When a new Enemy is created, register it with the HUD, and an Enemy Tracker will be created.
   * 
   * @param {any} enemy 
   * @memberof Radar
   */
  registerEnemy(enemy) {
    // Shorthand.
    const player = this.game.globals.player;
    const hud = this.game.globals.hud;

    // Calculate initial position of the Enemy Tracker.
    const { x, y } = this._getTrackerPosition(enemy);

    // Create the Arrow Image for the Enemy Tracker.
    const arrowImg = this.game.make.image(x, y, "assets", "hud/targeting-arrow");
    arrowImg.anchor.copyFrom(player.anchor);
    const scale = 0.86;
    arrowImg.scale.setTo(scale, scale);
    // Color of arrow should match color of enemy.
    arrowImg.tint = enemy.tint;
    // Arrow starts off hidden.
    arrowImg.visible = false;

    // Add the Arrow Image to the HUD group.
    hud.add(arrowImg);

    // And add a Tracking entry, which will be useful for updating the position.
    this._trackedEnemies.push({ enemy: enemy, tracker: arrowImg });
  }

  /**
   * When an Enemy dies, remove it from the Registry and remove the Enemy Tracker.
   * 
   * @param {any} enemyToRemove 
   * @memberof Radar
   */
  removeEnemy(enemy) {
    const i = this._trackedEnemies.findIndex(elem => elem.enemy === enemy);
    this._trackedEnemies[i].tracker.destroy();
    this._trackedEnemies.splice(i, 1);
  }

  /**
   * Calculate the position of the Arrow Image based on the player position and the enemy position.
   * 
   * @param {any} entry 
   * @returns { x : int, y: int }
   * @memberof Radar
   */
  _getTrackerPosition(enemy) {
    // Shorthand.
    const player = this.game.globals.player;

    // Find the distance between the player and the enemy.
    const dist = player.position.distance(enemy.position);

    // If the distance between player/enemy is less than the light radius, but the enemy is still in
    // the dark, this means they are behind some wall. So use the position of the enemy instead of a
    // point in between.
    if (dist < player._playerLight.getRadius()) {
      return { x: enemy.position.x, y: enemy.position.y };
    } else {
      // The tracker should be placed around the radius of the light, between the enemy and the
      // player.
      const angle = player.position.angle(enemy.position);
      const radiusModifier = 5;
      const x =
        player.position.x + (radiusModifier + player._playerLight.getRadius()) * Math.cos(angle);
      const y =
        player.position.y + (radiusModifier + player._playerLight.getRadius()) * Math.sin(angle);

      return { x, y };
    }
  }

  /**
   * Determine the scale of the Tracker arrow based on the distance of the enemy from the player.
   * 
   * @param {BaseEnemy} enemy 
   * @returns 0 - 1 value to set the Arrow Scale to.
   * @memberof Radar
   */
  _getTrackerScale(enemy) {
    // Shorthand.
    const player = this.game.globals.player;

    // Calculate the distance between the enemy and the player.
    const dist = player.position.distance(enemy.position);

    // Normalize the distance based on the radius of the players light.
    const normalizedDist = dist / this.game.width;

    // Calculate a base scale percentage based on the Quadratic Ease-Out function.
    const scalePercent = 1 - Phaser.Easing.Quadratic.In(normalizedDist);

    return scalePercent;
  }
}
