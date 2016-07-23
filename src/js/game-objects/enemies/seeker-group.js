module.exports = SeekerGroup;

var Seeker = require("./seeker-enemy.js");

SeekerGroup.prototype = Object.create(Phaser.Group.prototype);

function SeekerGroup(game, numToSpawn) {
    var enemies = game.globals.groups.enemies;
    Phaser.Group.call(this, game, enemies, "seeker-group");
    
    var px = this.game.globals.player.x;
    var py = this.game.globals.player.y;
    var minDistance = 300;
    var maxDistance = 500;

    var radius = 300;    
    for (var i = 0; i < numToSpawn; i += 1) {
        var radius = this.game.rnd.integerInRange(300, 500);
        var angle = this.game.rnd.integerInRange(0, (2*Math.PI));
        var enemyX = px + (radius * Math.cos(angle));        
        var enemyY = py + (radius * Math.sin(angle));

        // Check if there is a tile at the current location
        // if not, create a new enemy and place it,
        // if there is a tile, decrease the counter and try again!
        var isClear = this.checkTileMapLocation(enemyX, enemyY);
        if (!isClear) i--;
        else new Seeker(game, enemyX, enemyY, this);
    }
}

SeekerGroup.prototype.checkTileMapLocation = function(x, y) {
    var checkTile = this.game.globals.tileMap.getTileWorldXY(x, y, 36, 36,
        this.game.globals.tileMapLayer);

    if (checkTile === null || checkTile === undefined) return true;
    else return false;
}