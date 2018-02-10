import { h, Component } from "preact";

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
            <li>L to spawn enemies</li>
          </ul>

          <p>Manually Switch Weapons</p>
          <ol style={{ marginLeft: "20px" }}>
            <li>Scattershot</li>
            <li>Rapid Shot</li>
            <li>Homing Shot</li>
            <li>Piercing Shot</li>
            <li>Rocket Launcher</li>
            <li>Flamethrower</li>
          </ol>
        </div>
      </div>
    );
  }
}
