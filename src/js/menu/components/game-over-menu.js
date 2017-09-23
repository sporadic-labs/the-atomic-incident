import { h } from "preact";

export default function GameOverMenu({ gameStore, onMainMenu, onRestart }) {
  return (
    <div id="game-over" class="menu">
      <button class="btn-close" onClick={onMainMenu}>
        <i class="fa fa-times" aria-hidden="true" />
      </button>
      <div class="menu-title">Game Over</div>
      <div class="final-score">Your Score: {gameStore.score}</div>
      <div class="final-score">Current High Score: {gameStore.highScore}</div>
      <button onClick={onRestart}>Restart</button>
      <button onClick={onMainMenu}>Main Menu</button>
    </div>
  );
}
