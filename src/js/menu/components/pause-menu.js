import { h } from "preact";

export default function PauseMenu({ gameStore, onResume, onMainMenu, onOptions }) {
  return (
    <div id="pause-menu" class="menu">
      <button class="btn-close" onClick={onResume}>
        <i class="fa fa-times" aria-hidden="true" />
      </button>
      <div class="menu-title">Game Paused</div>
      <div class="final-score">High Score: {gameStore.highScore}</div>
      <button onClick={onOptions}>Options</button>
      <button onClick={onResume}>Resume Game</button>
      <button onClick={onMainMenu}>Main Menu</button>
    </div>
  );
}
