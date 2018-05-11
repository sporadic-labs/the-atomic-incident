import "../css/main.scss";
import "babel-polyfill";
import "phaser";
import { observe, autorun } from "mobx";
import { gameStore, preferencesStore } from "./game-data/observable-stores";
import { Play, Load, StartMenu, SCENE_NAMES } from "./scenes";
import initializeAnalytics, { registerStateChange } from "./analytics";

import logger, { LOG_LEVEL } from "./helpers/logger";
logger.setLevel(PRODUCTION ? LOG_LEVEL.OFF : LOG_LEVEL.ALL);

const isLocalhost = location.hostname === "localhost" || location.hostname === "127.0.0.1";
initializeAnalytics(isLocalhost);

const gameSize = 750;
const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: "game-container",
  width: gameSize,
  height: gameSize,
  backgroundColor: "#000",
  pixelArt: false
});

// Disable right click menu
document.getElementById("game-container").addEventListener("contextmenu", e => {
  e.preventDefault();
  return false;
});

// Set up the menu system
import { MenuApp, Instructions } from "./menu";
import { h, render } from "preact";

render(
  <MenuApp
    gameStore={gameStore}
    preferencesStore={preferencesStore}
    width={gameSize}
    height={gameSize}
  />,
  document.body
);
if (!PRODUCTION) render(<Instructions />, document.body);

// Create the space for globals on the game object
const globals = (game.globals = {});
globals.tilemapNames = [
  "horizontal-1"
  // "diagonal-1"
  // "t-1"
];
globals.plugins = {};
globals.musicSound = null;

game.scene.add(SCENE_NAMES.LOAD, Load);
game.scene.add(SCENE_NAMES.START_MENU, StartMenu);
game.scene.add(SCENE_NAMES.PLAY, Play);
// game.scene.add(SCENE_NAMES.PLAY, Play);
// game.scene.add(SCENE_NAMES.LIGHTING_PERF, LightingPerf);
// game.scene.add(SCENE_NAMES.SAT_BODY_TEST, SatBodyTest);

observe(gameStore, "gameState", change => {
  const { newValue, oldValue } = change;
  if (game.scene.getScene(oldValue)) game.scene.stop(oldValue);
  game.scene.start(newValue);
});

  game.scene.start(gameStore.gameState);
  if (gameStore.pendingGameRestart) game.scene.start(gameStore.gameState);
});
// game.scene.onStateChange.add(() => {
//   gameStore.markRestartComplete();
//   registerStateChange(game.state.getCurrentState().key);
// });
// TODO: observe sound

//   // Control sound here so it changes regardless of the current phaser state loaded
//   const musicSound = globals.musicSound;
//   if (musicSound) musicSound.mute = preferencesStore.musicMuted;

gameStore.setGameState(SCENE_NAMES.LOAD);
