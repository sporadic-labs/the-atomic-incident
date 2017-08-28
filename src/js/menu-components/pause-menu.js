import {h} from "preact";

export default function PauseMenu({onOptions, onResume, onMainMenu}) {
    return (
        <div id="pause-menu">
            <button class="btn-close" onClick={onResume}>
                <i class="fa fa-times" aria-hidden="true"></i>
            </button>
            <div class="menu-title">Game Paused</div>
            <button id="pause-options" onClick={onOptions}>Options</button>
            <button id="pause-resume" onClick={onResume}>Resume Game</button>
            <button id="main-menu" onClick={onMainMenu}>Main Menu</button>
        </div>
    );
}