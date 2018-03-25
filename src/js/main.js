import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Boot, Load, StartMenu, Play, LightingPerf, SatBodyTest, GAME_STATE_NAMES } from "./states";
import initializeAnalytics from "./analytics";

const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
initializeAnalytics(isLocalhost);

// Enable/disable Debug.
const enableDebug = true;
const gameDimensions = 750;
// Keep this on CANVAS until Phaser 3 for performance reasons?
const game = new Phaser.Game({
  width: gameDimensions,
  height: gameDimensions,
  renderer: Phaser.CANVAS,
  enableDebug: enableDebug, // We can turn off debug when deploying - using debug causes a hit on webgl
  parent: "game-container"
});

// Set up the menu system
import { MenuApp, Instructions } from "./menu";
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
if (enableDebug) render(<Instructions />, document.body);

// Create the space for globals on the game object
const globals = (game.globals = {});
globals.tilemapNames = [
  // "dungeon-arcade-1",
  // "arcade-map-3",
  // "arcade-map-larger",
  "arcade-map-larger-brown"
  // "arcade-map-smaller"
  // "arcade-map-larger-T"
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
game.state.add(GAME_STATE_NAMES.SAT_BODY_TEST, SatBodyTest);

gameStore.setGameState(GAME_STATE_NAMES.BOOT);

autorun(() => {
  game.state.start(gameStore.gameState);
  if (gameStore.pendingGameRestart) game.state.start(gameStore.gameState);
});
game.state.onStateChange.add(() => {
  gameStore.markRestartComplete();
  ga("send", "event", "Game", "State Started", game.state.getCurrentState().key);
});
