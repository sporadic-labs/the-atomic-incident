import { h } from "preact";
import CloseSvg from "../../../images/close.svg";

export default function PauseMenu({ gameStore, onResume, onMainMenu, onOptions }) {
  return (
    <div id="pause-menu" class="menu">
      <button class="btn-close" onClick={onResume}>
        <CloseSvg />
      </button>
      <div class="menu-title">Game Paused</div>
      <div class="final-score">High Score: {gameStore.highScore}</div>
      <button onClick={onOptions}>Options</button>
      <button onClick={onResume}>Resume Game</button>
      <button onClick={onMainMenu}>Main Menu</button>
    </div>
  );
}
