import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Boot, Load, StartMenu, Play, LightingPerf, GAME_STATE_NAMES } from "./states";

// Enable/disable Debug.
const enableDebug = true;
const gameDimensions = 750;
// Keep this on CANVAS until Phaser 3 for performance reasons?
const game = new Phaser.Game({
  width: gameDimensions,
  height: gameDimensions,
  renderer: Phaser.WEBGL,
  enableDebug: enableDebug, // We can turn off debug when deploying - using debug causes a hit on webgl
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
  // "arcade-map-3",
  // "arcade-map-larger"
  "arcade-map-smaller"
  // "arcade-map-2",
  // "puzzle-map-1",
  // "pacman"
];
globals.plugins = {};

game.state.add(GAME_STATE_NAMES.BOOT, Boot);
game.state.add(GAME_STATE_NAMES.LOAD, Load);
game.state.add(GAME_STATE_NAMES.START_MENU, StartMenu);
game.state.add(GAME_STATE_NAMES.PLAY, Play);
game.state.add(GAME_STATE_NAMES.LIGHTING_PERF, LightingPerf);

gameStore.setGameState(GAME_STATE_NAMES.BOOT);

// If the game isn't in debug mode, remove the instructions from the dom.
if (!enableDebug) {
  const debugInstructionsElement = document.getElementById("debug-instructions");
  debugInstructionsElement.innerHTML = "";
}

autorun(() => {
  game.state.start(gameStore.gameState);
  if (gameStore.pendingGameRestart) game.state.start(gameStore.gameState);
});
game.state.onStateChange.add(() => gameStore.markRestartComplete());
