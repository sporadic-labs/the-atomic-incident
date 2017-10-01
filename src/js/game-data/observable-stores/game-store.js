import { extendObservable, action } from "mobx";
import storageAutosync from "./sync-to-storage";
import { MENU_STATE_NAMES } from "../../menu";
import { GAME_STATE_NAMES } from "../../states";

class GameStore {
  constructor() {
    extendObservable(this, {
      // State properties
      score: 0,
      highScore: 0,
      isPaused: false,
      menuState: MENU_STATE_NAMES.CLOSED,
      gameState: GAME_STATE_NAMES.BOOT,
      pendingGameRestart: false,
      newHighScore: false,

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
      resetHighScore: action(function() {
        this.highScore = 0;
      }),
      updateHighScore: action(function() {
        if (this.score > this.highScore) {
          this.highScore = this.score;
        }
      }),
      pause: action(function() {
        this.isPaused = true;
      }),
      unpause: action(function() {
        this.isPaused = false;
      }),
      setMenuState: action(function(newMenuState) {
        this.menuState = newMenuState;
      }),
      setGameState: action(function(newGameState) {
        this.gameState = newGameState;
      }),
      restartGame: action(function() {
        this.pendingGameRestart = true;
      }),
      markRestartComplete: action(function() {
        this.pendingGameRestart = false;
        this.newHighScore = false;
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
