import { h } from "preact";

export default function StartMenu({
  gameStore,
  onStart,
  onOptions,
  onAbout,
  goToInstructionsMenu
}) {
  return (
    <div id="start-menu" class="menu">
      <div class="menu-title">The Atomic Incident</div>
      <div class="final-score">High Score: {gameStore.highScore}</div>
      <button onClick={onStart}>Start Game</button>
      <button onClick={goToInstructionsMenu}>Instructions</button>
      <button onClick={onOptions}>Options</button>
      <div id="about" onClick={onAbout}>
        i
      </div>
    </div>
  );
}
