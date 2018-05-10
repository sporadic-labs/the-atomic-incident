import Boot from "./boot-state";
import Load from "./load-state";
import Play from "./play-state";
import LightingPerf from "./lighing-pef-state";
import StartMenu from "./start-menu-state";
import SatBodyTest from "./sat-body-test";

const SCENE_NAMES = {
  BOOT: "BOOT",
  LOAD: "LOAD",
  PLAY: "PLAY",
  START_MENU: "START_MENU",
  LIGHTING_PERF: "LIGHTING_PERF",
  SAT_BODY_TEST: "SAT_BODY_TEST"
};

export { Boot, Load, Play, StartMenu, LightingPerf, SatBodyTest, SCENE_NAMES };
