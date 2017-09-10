import { h, Component } from "preact";
import { observer } from "mobx-react";
import { MENU_STATE_NAMES } from "./index";
import { GAME_STATE_NAMES } from "../states";
import StartMenu from "./components/start-menu";
import PauseMenu from "./components/pause-menu";
import DebugMenu from "./components/debug-menu";
import OptionsMenu from "./components/options-menu";
import Switch from "./components/switch";
import PlayPauseToggle from "./components/play-pause-toggle";

const maxStoredHistory = 3;
const limitArrayToRecent = (arr, numRecent) =>
  arr.length > numRecent ? arr.slice(arr.length - numRecent) : arr;

const Menu = observer(
  class Menu extends Component {
    constructor(props) {
      super(props);
      this.state = {
        menuHistory: [],
        currentMenuState: this.props.gameStore.menuState
      };
    }

    addMenuState(newState) {
      // Update the internal component state and then register the change with the gameStore
      if (newState === this.state.currentMenuState) return;
      this.setState(
        prev => {
          const newHistory = limitArrayToRecent(
            [...prev.menuHistory, prev.currentMenuState],
            maxStoredHistory
          );
          return {
            menuHistory: newHistory,
            currentMenuState: newState
          };
        },
        () => this.props.gameStore.setMenuState(this.state.currentMenuState)
      );
    }

    goBackOneState() {
      // Update the internal component state and then register the change with the gameStore
      if (this.state.menuHistory.length === 0) return;
      this.setState(
        prev => {
          const history = prev.menuHistory.slice();
          const newState = history.pop();
          return {
            menuHistory: history,
            currentMenuState: newState
          };
        },
        () => this.props.gameStore.setMenuState(this.state.currentMenuState)
      );
    }

    startGame() {
      this.props.gameStore.unpause();
      this.addMenuState(MENU_STATE_NAMES.CLOSED);
      this.props.gameStore.setGameState(GAME_STATE_NAMES.PLAY);
    }

    goToStartMenu() {
      this.props.gameStore.unpause();
      this.addMenuState(MENU_STATE_NAMES.CLOSED);
      this.props.gameStore.setGameState(GAME_STATE_NAMES.START_MENU);
    }

    goToOptionsMenu() {
      this.props.gameStore.pause();
      this.addMenuState(MENU_STATE_NAMES.OPTIONS);
    }

    resume() {
      this.props.gameStore.unpause();
      this.addMenuState(MENU_STATE_NAMES.CLOSED);
    }

    pause() {
      this.props.gameStore.pause();
      this.addMenuState(MENU_STATE_NAMES.PAUSE);
    }

    // From observer: when mobx re-renders, update the component's internal state to match
    componentWillReact() {
      if (this.state.currentMenuState !== this.props.gameStore.menuState) {
        this.addMenuState(this.props.gameStore.menuState);
      }
    }

    render() {
      const { gameStore, preferencesStore, width, height } = this.props;
      const isGameRunning = gameStore.gameState === GAME_STATE_NAMES.PLAY;
      return (
        <div id="hud" style={{ width: `${width}px`, height: `${height}px` }}>
          <Switch menuName={gameStore.menuState}>
            <StartMenu
              menuName={MENU_STATE_NAMES.START_MENU}
              onOptions={() => this.goToOptionsMenu()}
              onStart={() => this.startGame()}
            />
            <PauseMenu
              menuName={MENU_STATE_NAMES.PAUSE}
              onMainMenu={() => this.goToStartMenu()}
              onOptions={() => this.goToOptionsMenu()}
              onResume={() => this.resume()}
            />
            <DebugMenu
              menuName={MENU_STATE_NAMES.DEBUG}
              preferencesStore={preferencesStore}
              onResume={() => this.resume()}
            />
            <OptionsMenu
              menuName={MENU_STATE_NAMES.OPTIONS}
              isClosable={isGameRunning}
              preferencesStore={preferencesStore}
              onResume={() => this.resume()}
              onBack={() => this.goBackOneState()}
            />
          </Switch>

          {isGameRunning ? (
            <PlayPauseToggle
              isPaused={gameStore.isPaused}
              onPause={() => this.pause()}
              onResume={() => this.resume()}
            />
          ) : (
            ""
          )}
        </div>
      );
    }
  }
);

export default Menu;
