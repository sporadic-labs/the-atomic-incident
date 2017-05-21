const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
const Colors = require("../../constants/colors.js");
const Path = require("../../helpers/path.js");

class FlythroughWave {
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
        const pad = 50;
        // Extend path offscreen - paths are simply a line with two points, so it's just a matter of
        // extending the first and last point in the path. The first point is at the top or left of
        // the screen
        for (const vPath of vertical) {
            const p1 = vPath.getPointAtIndex(0);
            const p2 = vPath.getPointAtIndex(1);
            p1.y = -pad;
            p2.y = this.game.height + pad;
        }
        for (const hPath of horizontal) {
            const p1 = hPath.getPointAtIndex(0);
            const p2 = hPath.getPointAtIndex(1);
            p1.x = -pad;
            p2.x = this.game.width + pad;
        }
        this._paths = [...vertical, ...horizontal];
    }

    _spawnIndividual(path, enemyColor, shield) {
        let color;
        let shieldColor;
        if (enemyColor === "red") {
            color = Colors.red;
            // If the shield flag was set when the wave was generated, choose
            // a random colored shield that does NOT match the enemy color.
            if (shield) {
                shieldColor = this.game.rnd.pick([Colors.green, Colors.blue])
            }
        } else if (enemyColor === "green") {
            color = Colors.green;
            // If the shield flag was set when the wave was generated, choose
            // a random colored shield that does NOT match the enemy color.
            if (shield) {
                shieldColor = this.game.rnd.pick([Colors.red, Colors.blue])
            }
        } else {
            color = Colors.blue;
            // If the shield flag was set when the wave was generated, choose
            // a random colored shield that does NOT match the enemy color.
            if (shield) {
                shieldColor = this.game.rnd.pick([Colors.green, Colors.red])
            }
        }
        const firstPoint = path.getPointAtLength(0);
        const enemy = new ShadowEnemy(this.game, firstPoint.x, firstPoint.y,
            this._enemies, color);
        const comp = new TweenPathComp(enemy, path.clone(), this.speed, 100, false, false, true);
        comp._tween.easing(Phaser.Easing.Linear.None, -1);
        enemy.setMovementComponent(comp);
    }

    _spawnWithDelay(path, enemyTypes, delay, shield) {
        for (const [i, enemyType] of enemyTypes.entries()) {
            this._timer.add(i * delay, this._spawnIndividual, this, path, enemyType, shield);
        }
    }

    spawn() {
        const path = this.game.rnd.pick(this._paths);
        const enemyTypes = this._waveComposition.generate().getEnemiesArray();
        const shield = this._waveComposition._hasShield;
        const individualDelay = 1000;
        const totalTime = enemyTypes.length * individualDelay + 4000;
        const callback = this._spawnWithDelay.bind(this, path, enemyTypes, individualDelay, shield);
        this._timer.loop(totalTime, callback);
        callback();
    }

    destroy() {
        this._levelManager.levelChangeSignal.remove(this._getPaths, this);
        this._timer.destroy();
    }
}

module.exports = FlythroughWave;