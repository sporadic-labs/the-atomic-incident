import { h, Component } from "preact";
import { observer } from "mobx-preact";
import { MENU_STATE_NAMES } from "./index";
import { SCENE_NAMES } from "../scenes";
import StartMenu from "./components/start-menu";
import PauseMenu from "./components/pause-menu";
import DebugMenu from "./components/debug-menu";
import AboutMenu from "./components/about-menu";
import OptionsMenu from "./components/options-menu";
import InstructionsMenu from "./components/instructions-menu";
import GameOverMenu from "./components/game-over-menu";
import PlayPauseToggle from "./components/play-pause-toggle";

const Menu = observer(
  class Menu extends Component {
    goBackOneState = () => {
      this.props.gameStore.goBackOneMenuState();
    };

    startGame = () => {
      this.props.gameStore.unpause();
      this.props.gameStore.setGameState(SCENE_NAMES.PLAY);
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
    };

    restartGame = () => {
      this.props.gameStore.unpause();
      this.props.gameStore.setGameState(SCENE_NAMES.PLAY);
      this.props.gameStore.restartGame();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
    };

    goToStartMenu = () => {
      this.props.gameStore.unpause();
      // TODO: this seems wrong, but was how the previous version was written. Double check when the
      // play scene is updated to v3.
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
      this.props.gameStore.setGameState(SCENE_NAMES.START_MENU);
    };

    goToOptionsMenu = () => {
      this.props.gameStore.pause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.OPTIONS);
    };

    goToAboutMenu = () => {
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.ABOUT);
    };

    goToInstructionsMenu = () => {
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.INSTRUCTIONS);
    };

    gameOver = () => {
      this.props.gameStore.pause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.GAME_OVER);
    };

    resume = () => {
      this.props.gameStore.unpause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.CLOSED);
    };

    pause = () => {
      this.props.gameStore.pause();
      this.props.gameStore.setMenuState(MENU_STATE_NAMES.PAUSE);
    };

    render() {
      const { gameStore, preferencesStore, width, height } = this.props;
      const isGameRunning = gameStore.gameState === SCENE_NAMES.PLAY;

      let activeMenu;
      if (gameStore.menuState === MENU_STATE_NAMES.START_MENU) {
        activeMenu = (
          <StartMenu
            gameStore={gameStore}
            onOptions={this.goToOptionsMenu}
            onStart={this.startGame}
            onAbout={this.goToAboutMenu}
            goToInstructionsMenu={this.goToInstructionsMenu}
          />
        );
      } else if (gameStore.menuState === MENU_STATE_NAMES.PAUSE) {
        activeMenu = (
          <PauseMenu
            gameStore={gameStore}
            onMainMenu={this.goToStartMenu}
            onOptions={this.goToOptionsMenu}
            onResume={this.resume}
          />
        );
      } else if (gameStore.menuState === MENU_STATE_NAMES.DEBUG) {
        activeMenu = (
          <DebugMenu
            preferencesStore={preferencesStore}
            gameStore={gameStore}
            onResume={this.resume}
          />
        );
      } else if (gameStore.menuState === MENU_STATE_NAMES.OPTIONS) {
        activeMenu = (
          <OptionsMenu
            isClosable={isGameRunning}
            preferencesStore={preferencesStore}
            onResume={this.resume}
            onBack={this.goBackOneState}
          />
        );
      } else if (gameStore.menuState === MENU_STATE_NAMES.ABOUT) {
        activeMenu = <AboutMenu gameStore={gameStore} onBack={this.goBackOneState} />;
      } else if (gameStore.menuState === MENU_STATE_NAMES.INSTRUCTIONS) {
        activeMenu = <InstructionsMenu gameStore={gameStore} onBack={this.goBackOneState} />;
      } else if (gameStore.menuState === MENU_STATE_NAMES.INFO) {
        activeMenu = (
          <OptionsMenu
            isClosable={isGameRunning}
            preferencesStore={preferencesStore}
            onResume={this.resume}
            onBack={this.goBackOneState}
          />
        );
      } else if (gameStore.menuState === MENU_STATE_NAMES.GAME_OVER) {
        activeMenu = (
          <GameOverMenu
            gameStore={gameStore}
            onMainMenu={this.goToStartMenu}
            onRestart={this.restartGame}
          />
        );
      }

      return (
        <div id="hud" style={{ width: `${width}px`, height: `${height}px` }}>
          {activeMenu}
          {isGameRunning && (
            <PlayPauseToggle
              isPaused={gameStore.isPaused}
              onPause={this.pause}
              onResume={this.resume}
            />
          )}
        </div>
      );
    }
  }
);

export default Menu;
