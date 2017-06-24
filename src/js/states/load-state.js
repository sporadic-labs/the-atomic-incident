/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState() {}

LoadState.prototype.preload = function () {    
    // Images
    this.load.atlasJSONHash("assets", "resources/atlases/assets.png", 
        "resources/atlases/assets.json");

    // Tilemap
    for (const tilemapName of this.game.globals.tilemapNames) {
        const path = `resources/tilemaps/${tilemapName}.json`;
        const key = tilemapName.split(".")[0];
        this.load.tilemap(key, path, null, Phaser.Tilemap.TILED_JSON);
    }
    this.load.image("tiles", "resources/tilemaps/tiles.png");

    // Sounds
    this.load.audio("pop", "resources/audio/pop.mp3");
    this.load.audio("whoosh", "resources/audio/whoosh.mp3");
    this.load.audio("whoosh-2", "resources/audio/whoosh-2.mp3");
    this.load.audio("warp", "resources/audio/warp.mp3");
    this.load.audio("warp-2", "resources/audio/warp-2.mp3");
    this.load.audio("impact", "resources/audio/impact.mp3");
    this.load.audio("impact-2", "resources/audio/impact-2.mp3");
    this.load.audio("smash", "resources/audio/smash.mp3");

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
    this.game.state.start("test"); // for testing
    // this.game.state.start("slick-ui-test"); // for testing

};