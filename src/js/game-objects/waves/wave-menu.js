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
        // Get the number of enemies and pickups generated during this wave.
        var waveNum = wave ? wave.waveNumber : 0;
        var { red: redEnemies, green: greenEnemies, blue: blueEnemies } = this._getEnemyTotals(wave);
        var { red: redAmmo, green: greenAmmo, blue: blueAmmo } = this._getAmmoTotals(wave);

        // Create a timer for controlling how long the menu is displayed.
        const showMenuFor = 3000; // Time in ms to show the menu.
        this._timer = game.time.create(false);
        this._timer.start();
        // When the timer is up, destroy the menu.
        this._timer.add(showMenuFor, () => {
            this.destroy();
        });

        // Create a template string for the Wave Menu, to be added to the DOM.
        let menuTemplate = `
            <div id="wave-menu" class="hidden">
                <div class="menu-title">Wave ${waveNum}</div>
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
            </div>
        `;

        // Add the menu to the DOM.
        $("#hud").htmlAppend(menuTemplate);
        // Toggle the hidden class to show the menu.
        $("#wave-manager").toggleClass("hidden");
        // TODO(rex): Add a class to the #hud for dimming the background.

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
            <div class="wave-menu-col ${colorClass}"><span class="${spriteName} sprite"></span></div>
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

    destroy() {
        // Toggle the 'hidden' class on the wave menu, to animate it hiding.
        $("wave-menu").toggleClass("hidden");
        // Remove the 'wave-menu' element from the DOM.
        $("#wave-menu").remove();
        // TODO(rex): Remove the class dimming the #hud element.

        // Destroy the timer.
        this._timer.destroy();
        
    }
}

export default WaveMenu;