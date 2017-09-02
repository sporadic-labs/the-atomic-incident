import { h, Component } from "preact";

export default class DebugMenu extends Component {
  constructor({ gameData }) {
    super();
    const { shadowOpacity, shadersEnabled, physicsDebug } = gameData.debugSettings;
    this.state = { shadowOpacity, shadersEnabled, physicsDebug };
  }

  onOpacityChange(shadowOpacity) {
    this.props.gameData.debugSettings.shadowOpacity = shadowOpacity;
    this.setState({ shadowOpacity });
  }

  onShaderChange(value) {
    this.props.gameData.debugSettings.shadersEnabled = value;
    this.setState({ shadersEnabled: value });
  }

  onPhysicsChange(value) {
    this.props.gameData.debugSettings.physicsDebug = value;
    this.setState({ physicsDebug: value });
  }

  render({ gameData }, { shadowOpacity, shadersEnabled, physicsDebug }) {
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
