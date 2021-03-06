import "../css/main.scss";
import "babel-polyfill";
import "phaser-ce/build/custom/pixi";
import "phaser-ce/build/custom/p2";
import "phaser-ce/build/custom/phaser-split";
import { autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Boot, Load, StartMenu, Play, LightingPerf, SatBodyTest, GAME_STATE_NAMES } from "./states";
import initializeAnalytics, { registerStateChange } from "./analytics";

import logger, { LOG_LEVEL } from "./helpers/logger";
logger.setLevel(PRODUCTION ? LOG_LEVEL.OFF : LOG_LEVEL.ALL);

const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
initializeAnalytics(isLocalhost);

// Enable/disable Debug.
const enableDebug = !PRODUCTION;
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
  "horizontal-1"
  // "diagonal-1"
  // "t-1"
];
globals.plugins = {};
globals.musicSound = null;

game.state.add(GAME_STATE_NAMES.BOOT, Boot);
game.state.add(GAME_STATE_NAMES.LOAD, Load);
game.state.add(GAME_STATE_NAMES.START_MENU, StartMenu);
game.state.add(GAME_STATE_NAMES.PLAY, Play);
game.state.add(GAME_STATE_NAMES.LIGHTING_PERF, LightingPerf);
game.state.add(GAME_STATE_NAMES.SAT_BODY_TEST, SatBodyTest);

gameStore.setGameState(GAME_STATE_NAMES.BOOT);

autorun(() => {
  // Control sound here so it changes regardless of the current phaser state loaded
  const musicSound = globals.musicSound;
  if (musicSound) musicSound.mute = preferencesStore.musicMuted;

  game.state.start(gameStore.gameState);
  if (gameStore.pendingGameRestart) game.state.start(gameStore.gameState);
});
game.state.onStateChange.add(() => {
  gameStore.markRestartComplete();
  registerStateChange(game.state.getCurrentState().key);
});
