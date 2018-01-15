import Boot from "./boot-state";
import Load from "./load-state";
import Play from "./play-state";
import LightingPerf from "./lighing-pef-state";
import StartMenu from "./start-menu-state";

const GAME_STATE_NAMES = {
  BOOT: "BOOT",
  LOAD: "LOAD",
  PLAY: "PLAY",
  START_MENU: "START_MENU",
  LIGHTING_PERF: "LIGHTING_PERF"
};

export { Boot, Load, Play, StartMenu, LightingPerf, GAME_STATE_NAMES };
