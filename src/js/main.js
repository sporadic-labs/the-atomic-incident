var Sandbox = require("./states/sandbox.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");
var StartScreen = require("./states/start-screen.js");

// Keep this on CANVAS until Phaser 3 for performance reasons?
var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container");

game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("start", StartScreen);
game.state.add("sandbox", Sandbox);
game.state.start("boot");