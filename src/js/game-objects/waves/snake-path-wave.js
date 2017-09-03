import Wave from "./wave";
const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
import Color from "../../helpers/color";
import { parsePathLayers } from "../../helpers/parse-tiled-paths";

class SnakePathWave extends Wave {
  /**
     * Creates an instance of SnakePathWave.
     * @param {Phaser.Game} game
     * @param {Object} param
     * @param {number} param.speed Speed of the enemy's movement during the tween
     * @param {string[]} param.paths Array of strings that describe the Tiled paths to load. The
     * strings use a shorthand to describe which directions to move along the path: "pathname:1" for
     * moving along the direction of the path; "pathname:-1" for the reverse direction. A single
     * path from this array will be randomly chosen.
     *
     * @memberof SnakePathWave
     */
  constructor(game, { speed = 100, paths = [] }) {
    super(game);
    this.game = game;
    this.speed = speed;

    this._timer = this.game.time.create(false);
    this._timer.start();

    this._getPaths(paths);

    // If the level has changed, check for paths in the new tilemap
    this._levelManager.levelChangeSignal.add(this._getPaths, this);
  }

  _getPaths(pathNames) {
    const map = this.game.globals.levelManager.getCurrentTilemap();
    this._paths = parsePathLayers(map, pathNames);
    if (this._paths.length === 0) console.warn(`No paths found for ${pathNames}`);
  }

  _spawn(path, enemyColor) {
    let color;
    if (enemyColor === "red") color = Color.red();
    else if (enemyColor === "green") color = Color.green();
    else color = Color.blue();
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

  spawn(waveComposition) {
    const path = this.game.rnd.pick(this._paths);
    if (!path) return;
    const enemyTypes = waveComposition.generate().getEnemiesArray();
    for (const [i, enemyType] of enemyTypes.entries()) {
      this._timer.add(i * 600, this._spawn, this, path, enemyType);
    }
  }

  destroy() {
    this._levelManager.levelChangeSignal.remove(this._getPaths, this);
    this._timer.destroy();
  }
}

export default SnakePathWave;
