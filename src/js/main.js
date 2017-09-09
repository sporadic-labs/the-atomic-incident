import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Boot, Load, StartMenu, Play, GAME_STATE_NAMES } from "./states";

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
import { MenuApp } from "./menu";
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

// Hook up the game store's state to automatically be updated when the game state changes
game.state.onStateChange.add(stateName => {
  gameStore.setGameState(stateName);
});

game.state.add(GAME_STATE_NAMES.BOOT, Boot);
game.state.add(GAME_STATE_NAMES.LOAD, Load);
game.state.add(GAME_STATE_NAMES.START_MENU, StartMenu);
game.state.add(GAME_STATE_NAMES.PLAY, Play);
game.state.start(GAME_STATE_NAMES.BOOT);
