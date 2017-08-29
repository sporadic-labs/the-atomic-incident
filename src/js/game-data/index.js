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
                difficulty: "normal",
                menuName: null
            },
            debugSettings: {
                shadowOpacity: 1,
                shadersEnabled: true,
                physicsDebug: false
            },

            // Actions - these mutate the state
            setPause: action(function(pauseState = true) {
                this.currentGame.isPaused = pauseState;
            }),
            setMenu: action(function(menuName = null) {
                this.currentGame.menuName = menuName;
            })
        });
    }
}

// This should eventually read from and sync to local storage
const gameData = new GameData();

export default gameData;