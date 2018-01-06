import Boot from "./boot-state";
import Load from "./load-state";
import Play from "./play-state";
import StartMenu from "./start-menu-state";

const GAME_STATE_NAMES = {
  BOOT: "BOOT",
  LOAD: "LOAD",
  PLAY: "PLAY",
  START_MENU: "START_MENU"
};

export { Boot, Load, Play, StartMenu, GAME_STATE_NAMES };
