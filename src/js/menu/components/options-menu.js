import { h } from "preact";

import InputFix from "./input-fix";
import CloseSvg from "../../../images/close.svg";

export default function OptionsMenu({ preferencesStore, onResume, onBack, isClosable }) {
  const { volume } = preferencesStore;
  return (
    <div id="debug-menu" class="menu">
      {isClosable ? (
        <button class="btn-close" onClick={onResume}>
          <CloseSvg />
        </button>
      ) : (
        ""
      )}

      <div class="menu-title">Options</div>

      <form>
        <label>
          Volume
          <InputFix
            type="range"
            value={volume}
            min="0"
            max="1"
            step="0.05"
            class="slider"
            onChange={e => preferencesStore.setVolume(e.target.value)}
          />
        </label>
      </form>

      <button onClick={onBack}>Back</button>
    </div>
  );
}
