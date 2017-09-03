import { h } from "preact";

import InputFix from "./input-fix";

export default function DebugMenu({ preferencesStore }) {
  const { volume, shadowOpacity, shadersEnabled, physicsDebug } = preferencesStore;
  return (
    <div id="debug-menu">
      <form>
        <label>
          Volume
          <InputFix
            type="range"
            value={volume}
            min="0"
            max="1"
            step="0.05"
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
      </form>
    </div>
  );
}
