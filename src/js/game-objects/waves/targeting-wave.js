import Wave from "./wave";
const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TargetingComp = require("../components/targeting-component.js");
import Color from "../../helpers/color";

import { CircleWave, TunnelWave, CrossWave } from "./wave-shapes";

class TargetingWave extends Wave {
  /**
     * Creates an instance of TargetingWave.
     * @param {Object} waveShape 
     * 
     * @memberof TargetingWave
     */
  constructor(game, waveShape) {
    super(game);
    this._waveShape = waveShape;
  }

  /**
     * @static
     * @param {Object} options 
     * @param {number} [options.radius = 80] Radius of the circle wave
     * @returns {TargetingWave}
     * 
     * @memberof TargetingWave
     */
  static createCircle(game, { radius = 80 }) {
    const shape = new CircleWave(game, radius);
    return new TargetingWave(game, shape);
  }

  static createTunnel(game, { width = 100, length = 300, angle = 90 }) {
    const shape = new TunnelWave(game, width, length, angle);
    return new TargetingWave(game, shape);
  }

  static createCross(game, { length = 100 }) {
    const shape = new CrossWave(game, length);
    return new TargetingWave(game, shape);
  }

  spawn(waveComposition) {
    for (const enemyInfo of this._waveShape.enemies(waveComposition)) {
      const pos = enemyInfo.position;
      // Skip spawn point if the tile is occupied
      if (!this._isTileEmpty(pos.x, pos.y)) continue;
      // Spawn the enemy based on the type
      let color;
      let shieldColor;
      if (enemyInfo.type === "red") {
        color = Color.red();
        // If the shield flag was set when the wave was generated, choose
        // a random colored shield that does NOT match the enemy color.
        if (enemyInfo.shield) {
          shieldColor = this.game.rnd.pick([Color.green(), Color.blue()]);
        }
      } else if (enemyInfo.type === "green") {
        color = Color.green();
        // If the shield flag was set when the wave was generated, choose
        // a random colored shield that does NOT match the enemy color.
        if (enemyInfo.shield) {
          shieldColor = this.game.rnd.pick([Color.red(), Color.blue()]);
        }
      } else {
        color = Color.blue();
        // If the shield flag was set when the wave was generated, choose
        // a random colored shield that does NOT match the enemy color.
        if (enemyInfo.shield) {
          shieldColor = this.game.rnd.pick([Color.green(), Color.red()]);
        }
      }
      const enemy = new ShadowEnemy(
        this.game,
        pos.x,
        pos.y,
        "enemies/arrow-idle",
        this._enemies,
        color,
        shieldColor
      );
      enemy.setMovementComponent(new TargetingComp(enemy, 100));
    }
  }

  _isTileEmpty(x, y) {
    const map = this._levelManager.getCurrentTilemap();
    const wallLayer = this._levelManager.getCurrentWallLayer();
    var checkTile = map.getTileWorldXY(x, y, map.tileWidth, map.tileHeight, wallLayer, true);
    // null for invalid locations
    if (checkTile === null) return false;
    // Index of -1 is empty
    if (checkTile.index === -1) return true;
    else return false;
  }
}

export default TargetingWave;
