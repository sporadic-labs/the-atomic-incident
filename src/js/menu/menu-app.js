import { h, Component } from "preact";
import { observer } from "mobx-react";
import MENU_STATES from "./menu-states";
import PauseMenu from "./components/pause-menu";
import DebugMenu from "./components/debug-menu";
import Switch from "./components/switch";
import PlayPauseToggle from "./components/play-pause-toggle";

const Menu = observer(
  class Menu extends Component {
    resume() {
      this.props.gameStore.unpause();
      this.props.gameStore.setMenuState(MENU_STATES.NONE);
    }

    pause() {
      this.props.gameStore.pause();
      this.props.gameStore.setMenuState(MENU_STATES.PAUSE);
    }

    render() {
      const { gameStore, preferencesStore, width, height } = this.props;
      return (
        <div id="hud" style={{ width: `${width}px`, height: `${height}px` }}>
          <Switch menuName={gameStore.menuState}>
            <PauseMenu
              menuName={MENU_STATES.PAUSE}
              onResume={() => this.resume()}
              onOptions={() => console.log("options!")}
              onMainMenu={() => console.log("main menu!")}
            />
            <DebugMenu menuName={MENU_STATES.DEBUG} preferencesStore={preferencesStore} />
          </Switch>
          <PlayPauseToggle
            isPaused={gameStore.isPaused}
            onPause={() => this.pause()}
            onResume={() => this.resume()}
          />
        </div>
      );
    }
  }
);

export default Menu;
