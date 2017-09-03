import { h, Component } from "preact";

export default class DebugMenu extends Component {
  constructor({ preferencesStore }) {
    super();
    const { shadowOpacity, shadersEnabled, physicsDebug } = preferencesStore;
    this.state = { shadowOpacity, shadersEnabled, physicsDebug };
  }

  onOpacityChange(shadowOpacity) {
    this.props.preferencesStore.setShadowOpacity(shadowOpacity);
    this.setState({ shadowOpacity });
  }

  onShaderChange(value) {
    this.props.preferencesStore.setShadersEnabled(value);
    this.setState({ shadersEnabled: value });
  }

  onPhysicsChange(value) {
    this.props.preferencesStore.setPhysicsDebug(value);
    this.setState({ physicsDebug: value });
  }

  render({ preferencesStore }, { shadowOpacity, shadersEnabled, physicsDebug }) {
    return (
      <div id="debug-menu">
        <form>
          <label>
            Shadow Opacity
            <input
              type="range"
              value={shadowOpacity}
              min="0"
              max="1"
              step="0.05"
              onChange={e => this.onOpacityChange(e.target.value)}
            />
          </label>

          <label>
            Shaders Enabled:
            <input
              type="checkbox"
              checked={shadersEnabled}
              onClick={() => this.onShaderChange(!shadersEnabled)}
            />
          </label>

          <label>
            Debug Physics:
            <input
              type="checkbox"
              checked={physicsDebug}
              onClick={() => this.onPhysicsChange(!physicsDebug)}
            />
          </label>
        </form>
      </div>
    );
  }
}
