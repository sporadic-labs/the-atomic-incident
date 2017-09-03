import { extendObservable, action } from "mobx";
import storageAutosync from "./sync-to-storage";
import MENU_STATES from "../../menu/menu-states";

class GameStore {
  constructor() {
    extendObservable(this, {
      // State properties
      score: 0,
      highScore: 0,
      isPaused: false,
      menuState: MENU_STATES.NONE,

      // Actions - these mutate the state
      setScore: action(function(score) {
        this.score = score;
      }),
      incrementScore: action(function(delta) {
        this.score += delta;
      }),
      setHighScore: action(function(highScore) {
        this.highScore = highScore;
      }),
      pause: action(function() {
        this.isPaused = true;
      }),
      unpause: action(function() {
        this.isPaused = false;
      }),
      setMenuState: action(function(newMenuState) {
        this.menuState = newMenuState;
      })
    });
  }

  // Controlling serialization
  toJSON() {
    return {
      highScore: this.highScore
    };
  }
}

const gameStore = new GameStore();
storageAutosync("game-store", gameStore);

export default gameStore;
