const ShadowEnemy = require("../enemies/shadow-enemy.js");
const TargetingComp = require("../components/targeting-component.js");
const Colors = require("../../constants/colors.js");

class TargetingWave {
    constructor(game, waveShape) {
        this.game = game;
        this._enemies = game.globals.groups.enemies;
        this._waveShape = waveShape;
        this._levelManager = this.game.globals.levelManager;
    }

    spawn() {
        for (const enemyInfo of this._waveShape.enemies()) {
            const pos = enemyInfo.position;
            // Skip spawn point if the tile is occupied
            if (!this._isTileEmpty(pos.x, pos.y)) continue;
            // Spawn the enemy based on the type
            let color;
            if (enemyInfo.type === "red") color = Colors.red;
            else if (enemyInfo.type === "green") color = Colors.green;
            else color = Colors.blue;
            // TODO(rex): Make a wave type that has enemies with shields.
            let shieldColor = Colors.green;
            const enemy = new ShadowEnemy(this.game, pos.x, pos.y, 
                this._enemies, color, shieldColor);
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

module.exports = TargetingWave;