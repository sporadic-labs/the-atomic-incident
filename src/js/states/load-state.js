/**
 * LoadState - this is the loading screen
 */

module.exports = LoadState;

function LoadState() {}

LoadState.prototype.preload = function () {    
    // Images
    this.load.atlasJSONHash("assets", "images/atlases/assets.png", 
        "images/atlases/assets.json");

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

    // this.game.state.start("game");
    this.game.state.start("start");

};