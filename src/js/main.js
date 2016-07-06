window.SAT = require("sat");

var Sandbox = require("./states/sandbox.js");
var GameState = require("./states/game-state.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");
var StartScreen = require("./states/start-screen.js");

var game = new Phaser.Game(800, 600, Phaser.AUTO, "game-container");
game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("start", StartScreen);
game.state.add("game", GameState);
game.state.add("sandbox", Sandbox);
game.state.start("boot");