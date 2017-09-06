import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import BootState from "./states/boot-state.js";
import LoadState from "./states/load-state.js";
import SandboxState from "./states/sandbox.js";

const gameDimensions = 750;
// Keep this on CANVAS until Phaser 3 for performance reasons?
const game = new Phaser.Game({
  width: gameDimensions,
  height: gameDimensions,
  renderer: Phaser.WEBGL,
  enableDebug: true, // We can turn off debug when deploying - using debug causes a hit on webgl
  parent: "game-container"
});

// Set up the menu system
import MenuApp from "./menu/menu-app";
import { h, render } from "preact";
render(
  <MenuApp
    gameStore={gameStore}
    preferencesStore={preferencesStore}
    width={gameDimensions}
    height={gameDimensions}
  />,
  document.body
);

// Create the space for globals on the game object
const globals = (game.globals = {});
globals.tilemapNames = [
  // "dungeon-arcade-1",
  "arcade-map"
  // "arcade-map-2",
  // "puzzle-map-1",
  // "pacman"
];
globals.plugins = {};

game.state.add("boot", BootState);
game.state.add("load", LoadState);
game.state.add("sandbox", SandboxState);
game.state.start("boot");
