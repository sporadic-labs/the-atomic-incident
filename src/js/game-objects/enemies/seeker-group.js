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
        var radius = this.game.rnd.integerInRange(300, 500)
        var angle = (i / numToSpawn) * (2 * Math.PI);
        var enemyX = px + (radius * Math.cos(angle));        
        var enemyY = py + (radius * Math.sin(angle));        
        new Seeker(game, enemyX, enemyY, this);
    }
}
