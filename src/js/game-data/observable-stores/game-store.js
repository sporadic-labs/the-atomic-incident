import { extendObservable, action, autorun } from "mobx";
import storageAutosync from "./sync-to-storage";
import { MENU_STATE_NAMES } from "../../menu";
import { SCENE_NAMES } from "../../scenes";

const maxMenuHistory = 3;

class GameStore {
  constructor() {
    extendObservable(this, {
      // State properties
      score: 0,
      highScore: 0,
      isPaused: false,
      menuStateHistory: [MENU_STATE_NAMES.CLOSED], // Reverse chronological order
      gameState: SCENE_NAMES.NO_SCENE,
      pendingGameRestart: false,

      // Computed properties
      get menuState() {
        return this.menuStateHistory[0];
      },

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
        if (newMenuState !== this.menuStateHistory[0]) {
          this.menuStateHistory = [
            newMenuState,
            ...this.menuStateHistory.slice(0, maxMenuHistory - 1)
          ];
        }
      }),
      goBackOneMenuState: action(function() {
        if (this.menuStateHistory.length > 0) this.menuStateHistory.shift();
      }),
      setGameState: action(function(newGameState) {
        this.gameState = newGameState;
      }),
      restartGame: action(function() {
        this.pendingGameRestart = true;
      }),
      markRestartComplete: action(function() {
        this.pendingGameRestart = false;
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
