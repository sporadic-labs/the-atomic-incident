import {h, Component} from "preact";
import {observer} from "mobx-react";
import PauseMenu from "./pause-menu";

const Menu = observer(class Menu extends Component {
    render() {
        const {gameData, width, height} = this.props;
        const isPaused = gameData.currentGame.isPaused;
        const style = {width: `${width}px`, height: `${height}px`}
        return (
            <div id="hud" style={style}>
                {
                    isPaused ?
                        <PauseMenu 
                            onResume={() => gameData.setPause(false)}
                            onOptions={() => console.log("options!")}
                            onMainMenu={() => console.log("main menu!")}
                        />
                    :
                        ""
                }
            </div>
        );
    }
});

export default Menu;
