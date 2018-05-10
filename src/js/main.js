import "../css/main.scss";
import "babel-polyfill";
import "phaser";
import { autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Load, StartMenu, Play, LightingPerf, SatBodyTest, SCENE_NAMES } from "./scenes";
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

game.state.add(SCENE_NAMES.LOAD, Load);
game.state.add(SCENE_NAMES.START_MENU, StartMenu);
game.state.add(SCENE_NAMES.PLAY, Play);
game.state.add(SCENE_NAMES.LIGHTING_PERF, LightingPerf);
game.state.add(SCENE_NAMES.SAT_BODY_TEST, SatBodyTest);

gameStore.setGameState(SCENE_NAMES.LOAD);

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
