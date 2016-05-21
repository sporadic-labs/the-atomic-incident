'use strict';

var GameState = require("./states/game-state.js");
var BootState = require("./states/boot-state.js");
var LoadState = require("./states/load-state.js");

var gameContainer = document.getElementById("game-container");
var game = new Phaser.Game(800, 600, Phaser.AUTO, gameContainer);
game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("game", GameState);
game.state.start("boot");