window.PIXI = require("phaser/build/custom/pixi");
window.p2 = require("phaser/build/custom/p2");
window.Phaser = require("phaser/build/custom/phaser-split");

var Sandbox = require("./states/sandbox.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");
var StartScreen = require("./states/start-screen.js");

// Keep this on CANVAS until Phaser 3 for performance reasons?
var game = new Phaser.Game(750, 750, Phaser.CANVAS, "game-container");

// Create the space for globals on the game object
var globals = game.globals = {};
globals.tilemapFiles = [
    "arcade-map.json",
    "arcade-map-2.json"
];
globals.plugins = {};

game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("start", StartScreen);
game.state.add("sandbox", Sandbox);
game.state.add("slick-ui-test", require("./states/slick-ui-test.js"));
game.state.start("boot");