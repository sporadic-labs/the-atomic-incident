import { h } from "preact";

import InputFix from "./input-fix";

export default function DebugMenu({ preferencesStore, gameStore, onResume }) {
  const { volume, shadowOpacity, shadersEnabled, physicsDebug, skipMenu } = preferencesStore;
  return (
    <div id="debug-menu" class="menu">
      <button class="btn-close" onClick={onResume}>
        <i class="fa fa-times" aria-hidden="true" />
      </button>
      <div class="menu-title">Debug Menu</div>
      <div>
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

        <label>
          Shadow Opacity
          <InputFix
            type="range"
            value={shadowOpacity}
            min="0"
            max="1"
            step="0.05"
            class="slider"
            onChange={e => preferencesStore.setShadowOpacity(e.target.value)}
          />
        </label>

        <label>
          Shaders Enabled:
          <input
            type="checkbox"
            checked={shadersEnabled}
            onClick={() => preferencesStore.setShadersEnabled(!shadersEnabled)}
          />
        </label>

        <label>
          Debug Physics:
          <input
            type="checkbox"
            checked={physicsDebug}
            onClick={() => preferencesStore.setPhysicsDebug(!physicsDebug)}
          />
        </label>

        <label>
          Skip main menu:
          <input
            type="checkbox"
            checked={skipMenu}
            onClick={() => preferencesStore.setSkipMenu(!skipMenu)}
          />
        </label>
        <button class="text-btn" onClick={() => gameStore.resetHighScore()}>
          Reset High Score
        </button>
        <button onClick={onResume}>Resume Game</button>
      </div>
    </div>
  );
}
