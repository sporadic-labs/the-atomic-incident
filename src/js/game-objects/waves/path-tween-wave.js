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
     * 
     * @memberof PathTweenWave
     */
    constructor(game, {speed = 100}) {
        super(game);
        this.speed = speed;

        this._getPaths();

        // If the level has changed, check for paths in the new tilemap
        this._levelManager.levelChangeSignal.add(this._getPaths, this);
    }

    _parseTiledPaths(tiledLayerKey) {
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
            paths.push(path);
        }
        return paths;
    }

    _getPaths() {
        const vertical = this._parseTiledPaths("vertical-paths");
        const horizontal = this._parseTiledPaths("horizontal-paths");
        const verticalReversed = vertical.map(p => p.clone().reverse());
        const horizontalReversed = vertical.map(p => p.clone().reverse());
        this._paths = [
            vertical, horizontal, verticalReversed, horizontalReversed,
            vertical.concat(verticalReversed),
            horizontal.concat(horizontalReversed),
        ];
    }

    spawn(waveComposition) {
        const paths = this.game.rnd.pick(this._paths);
        const enemyTypes = waveComposition
            .setTotal(paths.length)
            .generate()
            .getEnemiesArray();
        for (const [i, enemyType] of enemyTypes.entries()) {
            let color;
            if (enemyType === "red") color = Colors.red;
            else if (enemyType === "green") color = Colors.green;
            else color = Colors.blue;
            const path = paths[i];
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