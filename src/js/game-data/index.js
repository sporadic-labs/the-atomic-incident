import {extendObservable, action} from "mobx";

class GameData {
    constructor() {
        extendObservable(this, {
            // State properties
            preferences: {
                volume: 1
            },
            playerName: "player",
            highScores: [],
            currentGame: {
                score: 0,
                isPaused: false,
                difficulty: "normal"
            },
            debugSettings: {
                shadowOpacity: 1,
                shadersEnabled: true,
                physicsDebug: false
            },

            // Actions - these mutate the state
            setPause: action(function(pauseState) {
                this.currentGame.isPaused = pauseState;
            })
        });
    }
}

// This should eventually read from and sync to local storage
const gameData = new GameData();

export default gameData;