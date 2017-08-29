import {h, Component} from "preact";
import {observer} from "mobx-react";
import PauseMenu from "./pause-menu";
import DebugMenu from "./debug-menu";
import Switch from "./switch";

const Menu = observer(class Menu extends Component {
    resume() {
        this.props.gameData.setPause(false);
        this.props.gameData.setMenu(null);
    }

    render() {
        const {gameData, width, height} = this.props;
        const menuName = gameData.currentGame.menuName ? 
            gameData.currentGame.menuName.toLowerCase() : null;
        return (
            <div id="hud" style={{width: `${width}px`, height: `${height}px`}}>
                <Switch menuName={menuName}>
                    <PauseMenu menuName="pause"
                        onResume={() => this.resume()}
                        onOptions={() => console.log("options!")}
                        onMainMenu={() => console.log("main menu!")}
                    />
                    <DebugMenu menuName="debug" gameData={gameData}/>
                </Switch>
            </div>
        );
    }
});

export default Menu;
