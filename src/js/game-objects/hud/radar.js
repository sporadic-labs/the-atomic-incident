import Color from "../../helpers/color";

/**
 * Player Radar.
 * Keep track of enemy position.  Display an arrow
 * pointing in their general direction, relative to the player light.
 * If the enemy is in light, no need for the arrow.  Use your eyes!
 * 
 * @class Radar
 */
export default class Radar {
  /**
     * @param {Phaser.Game} game
     */
  constructor(game) {
    this.game = game;

    // Keep track of enemies and trackers.
    this.registeredEnemies = [];
    this.enemyTrackers = [];
  }

  /**
     * Update the position and rotation of each enemy registered with the radar.
     * 
     * @memberof Radar
     */
  update() {
    // Update Enemy Trackers
    for (const enemy of this.registeredEnemies) {
      this._updateEnemyTrackerPosition(enemy);
    }
  }

  /**
     * When a new Enemy is created, register it with the HUD, and an Enemy Tracker will be created.
     * 
     * @param {any} enemy 
     * @memberof Radar
     */
  registerEnemy(enemy) {
    this.registeredEnemies.push(enemy);
    this._addEnemyTracker(enemy);
  }

  /**
     * When an Enemy dies, remove it from the Registry and remove the Enemy Tracker.
     * 
     * @param {any} enemy 
     * @memberof Radar
     */
  removeEnemy(enemy) {
    this.registeredEnemies.filter(e => {
      return e !== enemy;
    });
    this._removeEnemyTracker(enemy);
  }

  /**
     * Add a Tracker entry to the list of EnemyTrackers, and create the HUD image.
     * 
     * @param {any} enemy 
     * @memberof Radar
     */
  _addEnemyTracker(enemy) {
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
    this.enemyTrackers.push({
      enemy: enemy,
      image: arrowImg
    });
  }

  /**
     * Remove a Tracker from the HUD, and remove it's entry form the list of EnemyTrackers.
     * 
     * @param {any} enemy 
     * @memberof Radar
     */
  _removeEnemyTracker(enemy) {
    // Shorthand
    const hud = this.game.globals.hud;

    // Find the Tracker entry associated with this enemy.
    const eT = this.enemyTrackers.find(e => {
      return e.enemy === enemy;
    });

    // Remove the Image from the Phaser Group.
    hud.remove(eT);

    // Destroy the Tracker arrow image.
    eT.image.destroy();

    // Then remove the Tracker from the list.
    this.enemyTrackers.filter(e => {
      return e.enemy === enemy;
    });
  }

  /**
     * Update the position of the Tracker Image based on the position of the
     * enemy, player, and light.
     * 
     * @param {any} enemy 
     * @memberof Radar
     */
  _updateEnemyTrackerPosition(enemy) {
    //Shorthand
    const player = this.game.globals.player;

    // Get the Tracking Entry for the requested enemy.
    const entry = this.enemyTrackers.find(e => {
      return e.enemy === enemy;
    });

    // If the enemy is in light, hide this tracker.
    if (player._playerLight._light.isPointInLight(enemy.position)) {
      entry.image.visible = false;
    } else {
      // If the enemy is in the dark, show the arrow an update it's position.
      entry.image.visible = true;

      // Position
      const { x: cX, y: cY } = this._getTrackerPosition(enemy);
      entry.image.position.copyFrom(new Phaser.Point(cX, cY));

      // Rotation
      const angle = player.position.angle(enemy.position);
      entry.image.rotation = angle + Math.PI / 2;

      // Scale
      const scale = this._getTrackerScale(enemy);
      entry.image.scale.setTo(scale, scale);

      // TODO(rex): If the icon is in shadow, tint it so it is visible.
      if (player._playerLight._light.isPointInLight(entry.image.position)) {
        entry.image.tint = Color.white();
      }
    }
  }

  /**
     * Calculate the position of the Arrow Image based on the player
     * position and the enemy position.
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

    // If the distance between player/enemy is less than the light radius,
    // but the enemy is still in the dark, this means they are behind some wall.
    // So use the position of the enemy instead of a point in between.
    if (dist < player._playerLight.getRadius()) {
      return { x: enemy.position.x, y: enemy.position.y };
    } else {
      // The tracker should be placed around the radius of the light,
      // between the enemy and the player.
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
     * Determine the scale of the Tracker arrow based on the
     * distance of the enemy from the player.
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
