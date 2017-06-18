import Wave from "./wave";
const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
const Colors = require("../../constants/colors.js");
const Path = require("../../helpers/path.js");

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
    constructor(game, {speed = 100, paths = []}) {
        super(game);
        this.speed = speed;

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

    spawn(waveComposition) {
        const enemyTypes = waveComposition
            .setTotal(this._paths.length)
            .generate()
            .getEnemiesArray();
        for (const [i, enemyType] of enemyTypes.entries()) {
            let color;
            if (enemyType === "red") color = Colors.red;
            else if (enemyType === "green") color = Colors.green;
            else color = Colors.blue;
            const path = this._paths[i];
            const firstPoint = path.getPointAtLength(0);
            const enemy = new ShadowEnemy(this.game, firstPoint.x, firstPoint.y,
                "enemies/circle-idle", this._enemies, color);
            enemy.setMovementComponent(new TweenPathComp(enemy, path.clone(), this.speed));
        }
    }

    destroy() {
        this._levelManager.levelChangeSignal.remove(this._getPaths, this);
    }
}

export default PathTweenWave;