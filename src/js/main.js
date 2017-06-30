require("babel-polyfill");
// DOM manipulation lib (NOT jQuery)
require("chibijs");

window.PIXI = require("phaser-ce/build/custom/pixi");
window.p2 = require("phaser-ce/build/custom/p2");
window.Phaser = require("phaser-ce/build/custom/phaser-split");

const gameDimensions = 750;

// Keep this on CANVAS until Phaser 3 for performance reasons?
var game = new Phaser.Game({
    width: gameDimensions, 
    height: gameDimensions, 
    renderer: Phaser.WEBGL,
    enableDebug: true, // We can turn off debug when deploying - using debug causes a hit on webgl 
    parent: "game-container"
});

// Set HUD layer dimensions to match canvas.
$("#hud").css("width", gameDimensions + "px");
$("#hud").css("height", gameDimensions + "px");

// Hide all of the menus to begin with.
$("#start-menu").hide();
$("#options-menu").hide();

// Create the space for globals on the game object
var globals = game.globals = {};
globals.tilemapNames = [
    "arcade-map",
    "arcade-map-2",
    "puzzle-map-1",
    "pacman"
];
globals.plugins = {};

game.state.add("boot", require("./states/boot-state.js"));
game.state.add("load", require("./states/load-state.js"));
game.state.add("start", require("./states/start-screen.js"));
game.state.add("sandbox", require("./states/sandbox.js"));
game.state.add("test", require("./states/test-state.js"));
game.state.add("slick-ui-test", require("./states/slick-ui-test.js"));
game.state.start("boot");