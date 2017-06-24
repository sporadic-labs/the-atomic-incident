import Wave from "./wave";
const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
const Colors = require("../../constants/colors.js");
const Path = require("../../helpers/path.js");

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
    constructor(game, {speed = 100, paths = []}) {
        super(game);
        this.game = game;
        this.speed = speed;

        this._timer = this.game.time.create(false);
        this._timer.start();

        this._paths = this._getPaths(paths);

        // If the level has changed, check for paths in the new tilemap
        this._levelManager.levelChangeSignal.add(this._getPaths, this);
    }

    _parseTiledPaths(tiledLayerKey, shouldReverse = false) {
        const map = this.game.globals.levelManager.getCurrentTilemap();
        const tiledPaths = map.objects[tiledLayerKey] || [];
        const paths = [];
        for (var i = 0; i < tiledPaths.length; i++) {
            var pathNodes = tiledPaths[i].polyline || [];
            var startX = tiledPaths[i].x;
            var startY = tiledPaths[i].y;
            var path = new Path();
            for (var j = 0; j < pathNodes.length; j++) {
                path.addPoint(new Phaser.Point(
                    startX + pathNodes[j][0], startY + pathNodes[j][1]
                ));
            }
            if (shouldReverse) paths.push(path.reverse());
            else paths.push(path);
        }
        return paths;
    }

    _getPaths(pathNames) {
        const allPaths = [];
        for (const pathName of pathNames) {
            const [tiledName, direction] = pathName.split(":");
            const shouldReverse = (Number(direction) === -1) ? true : false;
            const paths = this._parseTiledPaths(tiledName, shouldReverse);
            allPaths.push(...paths);
        }
        return allPaths;
    }

    _spawn(path, enemyColor) {
        let color;
        if (enemyColor === "red") color = Colors.red;
        else if (enemyColor === "green") color = Colors.green;
        else color = Colors.blue;
        const firstPoint = path.getPointAtLength(0);
        const enemy = new ShadowEnemy(this.game, firstPoint.x, firstPoint.y, "enemies/circle-idle",
            this._enemies, color);
        enemy.setMovementComponent(new TweenPathComp(enemy, path.clone(), this.speed));
    }

    spawn(waveComposition) {
        const path = this.game.rnd.pick(this._paths);
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