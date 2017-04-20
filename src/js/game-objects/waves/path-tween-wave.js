const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TweenPathComp = require("../components/tween-path-component.js");
const Colors = require("../../constants/colors.js");

class PathTweenWave {
    constructor(game, waveComposition, speed) {
        this.game = game;
        this.speed = speed;
        this._waveComposition = waveComposition;
        this._enemies = game.globals.groups.enemies;

        // Construct some possible choices for subsets of paths
        const vertical = game.globals.paths.vertical;
        const horizontal = game.globals.paths.horizontal;
        const verticalReversed = vertical.map(p => p.clone().reverse());
        const horizontalReversed = vertical.map(p => p.clone().reverse());
        this._pathOptions = [
            vertical, horizontal, verticalReversed, horizontalReversed,
            vertical.concat(verticalReversed),
            horizontal.concat(horizontalReversed),
        ];
    }

    spawn() {
        const paths = this.game.rnd.pick(this._pathOptions);
        const enemyTypes = this._waveComposition
            .setTotalEnemies(paths.length)
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
                this._enemies, color);
            const comp = new TweenPathComp(enemy, path.clone(), this.speed);
            enemy.addComponent(comp);
        }
    }
}

module.exports = PathTweenWave;