import { h } from "preact";
import PlaySvg from "../../../images/play.svg";
import PauseSvg from "../../../images/pause.svg";

export default function PlayPauseToggle({ isPaused, onPause, onResume }) {
  return (
    <div id="pause-controls" onClick={isPaused ? onResume : onPause}>
      {isPaused ? <PlaySvg /> : <PauseSvg />}
    </div>
  );
}
