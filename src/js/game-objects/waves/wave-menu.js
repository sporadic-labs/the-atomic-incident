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
        console.log(wave);

        // Get the number of enemies and pickups generated during this wave.
        var waveNum = wave ? wave.waveNumber : 0;
        var redEnemies = wave ? wave.redAmmo : 0;
        var greenEnemies = wave ? wave.redAmmo : 0;
        var blueEnemies = wave ? wave.redAmmo : 0;
        var redAmmo = wave ? wave.redAmmo : 0;
        var greenAmmo = wave ? wave.redAmmo : 0;
        var blueAmmo = wave ? wave.redAmmo : 0;

        // Create a timer for controlling how long the menu is displayed.
        const showMenuFor = 500; // Time in ms to show the menu.
        this._timer = game.time.create(false);
        this._timer.start();
        // When the timer is up, destroy the menu.
        this._timer.add(showMenuFor, () => {
            this.destroy();
        });

        // Create a template string for the Wave Menu, to be added to the DOM.
        let menuTemplate = `<div id="wave-menu" class="hidden">`
        menuTemplate += `<div class="menu-title">Wave ${waveNum}</div>`;

        // Add a row for the Enemy indicators.
        menuTemplate += `<div class="wave-menu-row" >`

        if (redEnemies) {
            menuTemplate += this._colTemplate("enemy", Color.red, redEnemies);
        }

        if (greenEnemies) {
            menuTemplate += this._colTemplate("enemy", Color.green, greenEnemies);
        }

        if (blueEnemies) {
            menuTemplate += this._colTemplate("enemy", Color.blue, blueEnemies);
        }

        menuTemplate += `</div>`

        // Add a row for the Ammo Pickup indicators.
        menuTemplate += `<div class="wave-menu-row" >`

        if (redAmmo) {
            menuTemplate += this._colTemplate("ammo", Color.red, redAmmo);
        }

        if (greenAmmo) {
            menuTemplate += this._colTemplate("ammo", Color.green, greenAmmo);
        }

        if (blueAmmo) {
            menuTemplate += this._colTemplate("ammo", Color.blue, blueAmmo);
        }

        menuTemplate += `</div>`

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
        // newAmmoTemplate will be returned after it was constructed.
        let newAmmoTemplate = `<div class="wave-menu-row" >`;
        // Create some variables for constructing your ammoTemplage fragment.
        // const path = `./resources/atlases/frames/shadow-enemy.jpg`;
        let path = ``;
        // Ammo Color class will update based on the color argument.
        let ammoColorClass = ``;

        // Set the image path based on the 'type';
        switch(type) {
            case "ammo":
                path = `./resources/atlases/frames/shadow-enemy.jpg`;
                break;
            case "enemy":
                path = `./resources/atlases/frames/shadow-enemy.jpg`;
                break;
        }

        // Set the color class based on the 'Color'.
        switch(color) {
            case Color.red:
                ammoColorClass = 'ammo-red';
                break;
            case Color.green:
                ammoColorClass = 'ammo-green';
                break;
            case Color.blue:
                ammoColorClass = 'ammo-blue';
                break;
        }

        // Add an image element for the pickup sprite.
        newAmmoTemplate += `<img class="wave-menu-col" src="${path}" />`;
        // Add a div for the amount of pickups.
        newAmmoTemplate += `<div class="wave-menu-col ${ammoColorClass}"> x ${amt}</div>`;

        // Close the 'wave-menu-row' div.
        newAmmoTemplate += `</div>`;

        return newAmmoTemplate;
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