import { h } from "preact";

export default function PlayPauseToggle({ isPaused, onPause, onResume }) {
  return (
    <div id="pause-controls" onClick={isPaused ? onResume : onPause}>
      {isPaused ? <i class="fa fa-play" /> : <i class="fa fa-pause" />}
    </div>
  );
}
