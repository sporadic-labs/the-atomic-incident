const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
const Colors = require("../../constants/colors.js");
const Path = require("../../helpers/path.js");

class SnakePathWave {
    constructor(game, waveComposition, speed) {
        this.game = game;
        this.speed = speed;
        this._waveComposition = waveComposition;
        this._enemies = game.globals.groups.enemies;

        this._timer = this.game.time.create(false);
        this._timer.start();

        this._getPaths();

        // If the level has changed, check for paths in the new tilemap
        this._levelManager = game.globals.levelManager;
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
        this._paths = [...vertical, ...horizontal];
    }

    _spawn(path, enemyColor) {
        let color;
        if (enemyColor === "red") color = Colors.red;
        else if (enemyColor === "green") color = Colors.green;
        else color = Colors.blue;
        const firstPoint = path.getPointAtLength(0);
        const enemy = new ShadowEnemy(this.game, firstPoint.x, firstPoint.y,
            this._enemies, color);
        enemy.setMovementComponent(new TweenPathComp(enemy, path.clone(), this.speed));
    }

    spawn() {
        const path = this.game.rnd.pick(this._paths);
        const enemyTypes = this._waveComposition.generate().getEnemiesArray();
        for (const [i, enemyType] of enemyTypes.entries()) {
            this._timer.add(i * 600, this._spawn, this, path, enemyType);
        }
    }

    destroy() {
        this._levelManager.levelChangeSignal.remove(this._getPaths, this);
        this._timer.destroy();
    }
}

module.exports = SnakePathWave;