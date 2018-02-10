import MenuApp from "./menu-app";
import Instructions from "./instructions";

const MENU_STATE_NAMES = {
  CLOSED: "CLOSED",
  START_MENU: "START_MENU",
  PAUSE: "PAUSE",
  DEBUG: "DEBUG",
  OPTIONS: "OPTIONS",
  GAME_OVER: "GAME_OVER"
};

export { MenuApp, MENU_STATE_NAMES, Instructions };
