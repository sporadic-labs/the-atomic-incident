import { h, Component } from "preact";
import { observer } from "mobx-react";
import { MENU_STATE_NAMES } from "./index";
import { GAME_STATE_NAMES } from "../states";
import StartMenu from "./components/start-menu";
import PauseMenu from "./components/pause-menu";
import DebugMenu from "./components/debug-menu";
import Switch from "./components/switch";
import PlayPauseToggle from "./components/play-pause-toggle";

const Menu = observer(
  class Menu extends Component {
    startGame() {
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
      this.props.gameStore.setGameState(GAME_STATE_NAMES.PLAY);
    }

    resume() {
      this.props.gameStore.unpause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
    }

    pause() {
      this.props.gameStore.pause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.PAUSE);
    }

    render() {
      const { gameStore, preferencesStore, width, height } = this.props;
      const isPauseVisible = gameStore.gameState === GAME_STATE_NAMES.PLAY;
      return (
        <div id="hud" style={{ width: `${width}px`, height: `${height}px` }}>
          <Switch menuName={gameStore.menuState}>
            <StartMenu menuName={MENU_STATE_NAMES.START_MENU} onStart={() => this.startGame()} />
            <PauseMenu menuName={MENU_STATE_NAMES.PAUSE} onResume={() => this.resume()} />
            <DebugMenu
              menuName={MENU_STATE_NAMES.DEBUG}
              preferencesStore={preferencesStore}
              onResume={() => this.resume()}
            />
          </Switch>

          {isPauseVisible ? (
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
