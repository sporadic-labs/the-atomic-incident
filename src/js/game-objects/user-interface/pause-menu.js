
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

        // Create a template string for the Pause Menu, to be added to the DOM.
        let menuTemplate = `
            <div id="pause-menu">
                <button class="btn-close">x</button>
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
        $(".btn-close").on("click", () => {
            console.log("close!");
            this.game.paused = false;
            this.destroy();
        });
        $("#pause-options").on("click", () => {
            console.log("options!");
        });
        $("#pause-resume").on("click", () => {
            console.log("resume!");
            this.game.paused = false;
            this.destroy();
        });
        $("#pause-exit").on("click", () => {
            console.log("exit!");
        });

    }

    destroy() {
        // Toggle the 'hidden' class on the wave menu, to animate it hiding.
        $("#pause-menu").toggleClass("hidden");
        // Remove the 'pause-menu' element from the DOM.
        $("#pause-menu").remove();
        // TODO(rex): Remove the class dimming the #hud element.
       
    }
}

export default PauseMenu;