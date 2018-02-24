import { h, Component } from "preact";
import WEAPON_TYPES, { getFormattedType } from "../game-objects/weapons/weapon-types";

const formattedWeaponNames = Object.values(WEAPON_TYPES).map(type => getFormattedType(type));
const style = {
  position: "fixed",
  top: 0,
  left: "10px",
  zIndex: -1000,
  maxWidth: "300px",
  fontFamily: "montserrat"
};

export default class Instructions extends Component {
  constructor(props) {
    super(props);
    this.state = {
      show: true
    };
    this.onWindowResize();
  }

  onWindowResize = () => {
    this.setState({ show: window.innerWidth >= 1200 });
  };

  componentDidMount() {
    window.addEventListener("resize", this.onWindowResize);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.onWindowResize);
  }

  render() {
    const { show } = this.state;

    if (!show) return null;

    return (
      <div style={style}>
        <ul>
          <li>WASD/Arrow keys to move</li>
          <li>Left click to fire</li>
          <li>P to pause</li>
        </ul>
        <div>
          <ul>
            <li>E to open debug menu</li>
            <li>O to pause w/o menus</li>
            <li>R to kill all enemies</li>
            <li>K to spawn a normal wave</li>
            <li>L to spawn a special wave</li>
          </ul>

          <p>Manually Switch Weapons</p>
          <ol style={{ marginLeft: "20px" }}>
            {formattedWeaponNames.map(name => <li key={name}>{name}</li>)}
          </ol>
        </div>
      </div>
    );
  }
}
