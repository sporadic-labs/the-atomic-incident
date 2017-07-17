
class PauseMenu {

    /**
     * Creates an instance of PauseMenu.
     * @param {Phaser.Game} game
     *
     * @memberof PauseMenu
     */
    constructor(game) {
        // Store a ref to the game.
        this.game = game;

        // If the game gets paused from an outside source, this flag will be set.
        this.gamePausedFromOutsideSource = false;

        this.game.paused = true;

        // Create a template string for the Pause Menu, to be added to the DOM.
        let menuTemplate = `
            <div id="pause-menu">
                <button class="btn-close">
                    <i class="fa fa-times" aria-hidden="true"></i>
                </button>
                <div class="menu-title">Game Paused</div>
                <button id="pause-options">Options</button>
                <button id="pause-resume">Resume Game</button>
                <button id="pause-exit">Exit Game</button>
            </div>
        `;

        // Add the menu to the DOM.
        $("#hud").htmlAppend(menuTemplate);
        // Toggle the hidden class to show the menu.
        $("#pause-menu").toggleClass("hidden");
        // TODO(rex): Add a class to the #hud for dimming the background.

        // Setup the event listeners for the Pause Menu.
        $("#pause-menu .btn-close").on("click", () => {
            this._unpause();
            this.destroy();
        });
        $("#pause-menu #pause-options").on("click", () => {
            console.log("options!");
        });
        $("#pause-menu #pause-resume").on("click", () => {
            this._unpause();
            this.destroy();
        });
        $("#pause-menu #pause-exit").on("click", () => {
            console.log("exit!");
        });
    }

    _unpause() {
        this.game.paused = false;
        // this.unpauseSignal.dispatch();
        this.game.globals.onUnPause.dispatch();
    }

    destroy() {
        // Toggle the 'hidden' class on the wave menu, to animate it hiding.
        $("#pause-menu").toggleClass("hidden");
        // Remove the 'pause-menu' element from the DOM.
        $("#pause-menu").remove();
        // TODO(rex): Remove the class dimming the #hud element.
        // this.unpauseSignal.removeAll();
    }
}

export default PauseMenu;