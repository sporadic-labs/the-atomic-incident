import { h } from "preact";

export default function StartMenu({ onStart }) {
  return (
    <div id="pause-menu" class="menu">
      <div class="menu-title">Untitled Game!</div>
      <button onClick={onStart}>Start Game</button>
      <button disabled>Options</button>
    </div>
  );
}
