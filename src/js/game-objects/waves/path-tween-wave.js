import Wave from "./wave";
const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
import Color from "../../helpers/color";
import { parsePathLayers } from "../../helpers/parse-tiled-paths";

class PathTweenWave extends Wave {
  /**
     * Creates an instance of PathTweenWave.
     * @param {Phaser.Game} game
     * @param {Object} param
     * @param {number} param.speed Speed of the enemy's movement during the tween
     * @param {string[]} param.paths Array of strings that describe the Tiled paths to load. The
     * strings use a shorthand to describe which directions to move along the path: "pathname:1" for
     * moving along the direction of the path; "pathname:-1" for the reverse direction.
     *
     * @memberof PathTweenWave
     */
  constructor(game, { speed = 100, paths = [] }) {
    super(game);
    this.speed = speed;

    this._getPaths(paths);

    // If the level has changed, check for paths in the new tilemap
    this._levelManager.levelChangeSignal.add(this._getPaths, this);
  }

  _getPaths(pathNames) {
    const map = this.game.globals.levelManager.getCurrentTilemap();
    this._paths = parsePathLayers(map, pathNames);
    if (this._paths.length === 0) console.warn(`No paths found for ${pathNames}`);
  }

  spawn(waveComposition) {
    const enemyTypes = waveComposition
      .setTotal(this._paths.length)
      .generate()
      .getEnemiesArray();
    for (const [i, enemyType] of enemyTypes.entries()) {
      let color;
      if (enemyType === "red") color = Color.red();
      else if (enemyType === "green") color = Color.green();
      else color = Color.blue();
      const path = this._paths[i];
      const firstPoint = path.getPointAtLength(0);
      const enemy = new ShadowEnemy(
        this.game,
        firstPoint.x,
        firstPoint.y,
        "enemies/circle-idle",
        this._enemies,
        color
      );
      enemy.setMovementComponent(new TweenPathComp(enemy, path.clone(), this.speed));
    }
  }

  destroy() {
    this._levelManager.levelChangeSignal.remove(this._getPaths, this);
  }
}

export default PathTweenWave;
