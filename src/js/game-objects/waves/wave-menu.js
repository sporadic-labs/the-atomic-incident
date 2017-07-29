const Color = require("../../constants/colors");

class WaveMenu {

    /**
     * Creates an instance of WaveMenu.
     * @param {Phaser.Game} game
     * @param {any} waveManager
     *
     * @memberof WaveMeter
     */
    constructor(game, waveManager, wave) {
        // Store a reference to the game object.
        this.game = game;

        // If the game is paused from the outside, use this flag.
        this.gamePausedFromOutside = false;
        // Pause the game when the WaveMenu is created.
        this.game.paused = true;
        // Set the Pause signal (as the game is paused...).
        game.globals.onPause.dispatch();

        // Store the time that the menu was created.
        // NOTE(rex): This isn't used anywhere, currently...
        this.startTime = Date.now();
        // Create a variable to store the current time in this menus lifecycle.
        // NOTE(rex): Start at the full time allowed for this menu.
        this.time = 6000; // in ms

        // Add a callback for dealing with the pause button being selected while the game is already paused.
        game.globals.onPause.add(this._onPause, this);
        // And resuming too...
        game.globals.onUnPause.add(this._onResume, this);

        // Get the number of enemies and pickups generated during this wave.
        var {
            red: redEnemies,
            green: greenEnemies,
            blue: blueEnemies
        } = this._getEnemyTotals(wave);
        var { red: redAmmo, green: greenAmmo, blue: blueAmmo } = this._getAmmoTotals(wave);

        // Create a template string for the Wave Menu, to be added to the DOM.
        let menuTemplate = `
            <div id="wave-menu" class="hidden">
                <div class="menu-title">Wave ${waveManager.getWaveNumber()}</div>
                <div class="wave-menu-row">
                    ${redEnemies ? this._colTemplate("enemy", Color.red, redEnemies) : ""}
                    ${greenEnemies ? this._colTemplate("enemy", Color.green, greenEnemies) : ""}
                    ${blueEnemies ? this._colTemplate("enemy", Color.blue, blueEnemies) : ""}
                </div>
                <div class="wave-menu-row">
                    ${redAmmo ? this._colTemplate("ammo", Color.red, redAmmo) : ""}
                    ${greenAmmo ? this._colTemplate("ammo", Color.green, redAmmo) : ""}
                    ${blueAmmo ? this._colTemplate("ammo", Color.blue, redAmmo) : ""}
                </div>
                <div class="wave-menu-row">
                    <div class="wave-menu-col">
                        <div id="#wave-time">Next Wave in: <span id="wave-time-value">${this.time / 1000}</span></div>
                    </div>
                </div>
            </div>
        `;

        // Add the menu to the DOM.
        $("#hud").htmlAppend(menuTemplate);
        // Toggle the hidden class to show the menu.
        $("#wave-menu").toggleClass("hidden");
        // TODO(rex): Add a class to the #hud for dimming the background.

        // Setup an event listener that unpauses the game when the user clicks on the hud.
        $("#hud").on("click", () => {
            if (!this.gamePausedFromOutside) {
                console.log("was it this already though?");
                this.game.paused = false;
                this.destroy();
            }
        });
        // TODO(rt): Escape pauses too.
        // NOTE(rex): This doesn't work...
        $("#hud").on("keydown", (e) => {
            console.log(e);
            this.game.paused = false;
            this.destroy();
        });

        // Create a timer for controlling how long the menu is displayed.
        // When the timer is up, destroy the menu.
        // NOTE(rex): The timer for the pause menu cannot be linked to phaser,
        // as it gets paused while the game is paused.
        const timerInterval = 1000; // in ms.
        this._countdownTimer = setInterval(() => {
            // Decrement the timer and update the menu.
            this.time -= timerInterval;
            $("#wave-time-value").html(Math.round(this.time / 1000));
            // If the timer has reached 0, destroy the menu.
            if (this.time <= 0) {
                this.game.paused = false;
                this.destroy();
            }
        }, timerInterval);
    }

    /**
     * Create a new Column Template for the wave menu.
     * 
     * @param {string} type - Can be 'ammo' or 'enemy'.
     * @param {Color} color 
     * @param {int} amt 
     * @returns 
     * 
     * @memberof WaveMenu
     */
    _colTemplate(type, color, amt) {
        // Sprite image will be determined by the type.
        let spriteName = ``;
        // Ammo Color class will update based on the color argument.
        let colorClass = ``;

        // Set the image path based on the 'type';
        switch(type) {
            case "ammo":
                spriteName = `pickups-diamond-01`;
                break;
            case "enemy":
                spriteName = `enemies-arrow-idle`;
                break;
        }

        // Set the color class based on the 'Color'.
        switch(color) {
            case Color.red:
                colorClass = 'tint-red';
                break;
            case Color.green:
                colorClass = 'tint-green';
                break;
            case Color.blue:
                colorClass = 'tint-blue';
                break;
        }

        // Add an image element for the pickup sprite.
        const newAmmoTemplate = `
            <div class="wave-menu-col ${colorClass}">
                <span class="${spriteName} sprite"></span>
            </div>
            <div class="wave-menu-col"> x ${amt}</div>
        `;

        return newAmmoTemplate;
    }

    _getAmmoTotals(wave) {
        const ammoTotals = {red: 0, green: 0, blue: 0};
        for (const ammoDrop of wave.ammoDrops) {
            for (const [color, amount] of Object.entries(ammoDrop.ammo)) {
                ammoTotals[color] += amount;
            }
        }
        return ammoTotals;
    }

    _getEnemyTotals(wave) {
        const enemyTotals = {red: 0, green: 0, blue: 0};
        for (const enemyGroup of wave.enemyGroups) {
            const comp = enemyGroup.composition._composition;
            for (const [color, amount] of Object.entries(comp)) {
                enemyTotals[color] += amount;
            }
        }
        return enemyTotals;
    }

    _onResume(){
        const timerInterval = 1000; // in ms.
        this._countdownTimer = setInterval(() => {
            // Give this a tick so you don't destroy the menu immediately.
            this.gamePausedFromOutside = false;
            // Decrement the timer and update the menu.
            this.time -= timerInterval;
            $("#wave-time-value").html(Math.round(this.time / 1000));
            // If the timer has reached 0, destroy the menu.
            if (this.time <= 0) {
                this.game.paused = false;
                this.destroy();
            }
        }, timerInterval);
    }

    _onPause() {
        console.log("Paused from Wave Menu!");
        this.gamePausedFromOutside = true;
        this.time = Math.round(6000 - (Date.now() - this.startTime)) + 1;
        console.log(this.time);
        clearInterval(this._countdownTimer);
    }

    destroy() {
        // Toggle the 'hidden' class on the wave menu, to animate it hiding.
        $("wave-menu").toggleClass("hidden");
        // Remove the 'wave-menu' element from the DOM.
        $("#wave-menu").remove();
        // TODO(rex): Remove the class dimming the #hud element.

        // Destroy the timer.
        clearInterval(this._countdownTimer);

        this.game.globals.onPause.remove(this._onPause, this);
    }
}

export default WaveMenu;