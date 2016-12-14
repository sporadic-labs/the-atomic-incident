/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState() {}

// Set the 'current map' to be loaded by the game
// Default to level_03 until we have some actual maps...
LoadState.prototype.init = function (map) {
    this.currentMap = map ? map : 
        "resources/tilemaps/" + this.game.globals.tilemapFiles[0];
};

LoadState.prototype.preload = function () {    
    // Images
    this.load.atlasJSONHash("assets", "resources/atlases/assets.png", 
        "resources/atlases/assets.json");
    this.load.image("fogMask", "resources/images/fog-mask-2.png")

    // Tilemap
    this.load.tilemap("tilemap", this.currentMap, null, 
        Phaser.Tilemap.TILED_JSON);
    this.load.image("coloredTiles", "resources/tilemaps/tiles_25.png");
    this.load.image("wallTiles", "resources/tilemaps/wall-tiles.png");

    // Stand-in for a loading bar
    this.loadingText = this.add.text(this.world.centerX, this.world.centerY, 
        "0%", { 
            font: "200px Arial", 
            fill: "#000", 
            align: "center" 
        });
    this.loadingText.anchor.set(0.5);
};

LoadState.prototype.loadRender = function () {
    this.loadingText.setText(this.load.progress + "%");
};

LoadState.prototype.create = function () {
    // Since load progress might not reach 100 in the load loop, manually do it
    this.loadingText.setText("100%");

    // this.game.state.start("start"); // start screen
    this.game.state.start("sandbox"); // for testing

};