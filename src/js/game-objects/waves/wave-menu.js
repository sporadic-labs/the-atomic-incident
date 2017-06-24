import ModalMenu from '../user-interface/modal-menu'

const colors = require("../../constants/colors");

let color = {
    h: 1,
    s: 1,
    l: 0.5,
    a: 1
};

class WaveMenu extends ModalMenu {

    /**
     * Creates an instance of WaveMenu.
     * @param {Phaser.Game} game
     * @param {any} waveManager
     *
     * @memberof WaveMeter
     */
    constructor(game, waveManager) {
        super(game, game.globals.groups.hud, "WaveMenu");
        this.game = game;
        this._waveManager = waveManager;
        
        this._currentWaveIndex = 0;

        // Shorthands
        var globals = game.globals;
        var SlickUI = globals.plugins.SlickUI;

        // Shorthand for panel dimensions
        const spacing = 4;
        const pH = (this.panel.height / 10) + spacing;
        const pW = this.panel.width / 2;

        // Add some things to the panel.
        // Title w/ Current Wave Number
        this._title = this.addTitle(`Wave ${this._currentWaveIndex + 1}`, 0, 6);

        // Enemy composition
        const redEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 2,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(redEnemySprite);
        const redEnemies = new SlickUI.Element.Text(pW, pH * 2, `: 1`);
        this.panel.add(redEnemies);
        this._redEnemies = redEnemies;

        const greenEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 3,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(greenEnemySprite);
        const greenEnemies = new SlickUI.Element.Text(pW, pH * 3, `: 1`);
        this.panel.add(greenEnemies);
        this._greenEnemies = greenEnemies;

        const blueEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 4,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(blueEnemySprite);
        const blueEnemies = new SlickUI.Element.Text(pW, pH * 4, `: 1`);
        this.panel.add(blueEnemies);
        this._blueEnemies = blueEnemies;

        // Ammo composition
        const redAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 5,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(redAmmoSprite);
        const redAmmo = new SlickUI.Element.Text(pW, pH * 5, `: 1`);
        this.panel.add(redAmmo);
        this._redAmmo = redAmmo;

        const greenAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 6,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(greenAmmoSprite);
        const greenAmmo = new SlickUI.Element.Text(pW, pH * 6, `: 1`);
        this.panel.add(greenAmmo);
        this._greenAmmo = greenAmmo;

        const blueAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 7,
            game.make.sprite(0, 0, "assets", "shadow-enemy/tintable-idle"));
        this.panel.add(blueAmmoSprite);
        const blueAmmo = new SlickUI.Element.Text(pW, pH * 7, `: 1`);
        this.panel.add(blueAmmo);
        this._blueAmmo = blueAmmo;

        console.log(this.panel)
    }

    update() {}

    /**
     * Update the content of the Wave Menu.
     * 
     * @method updateValues
     * 
     * @param {number} [waveNum=0] 
     * @param {number} [redEnemies=0] 
     * @param {number} [greenEnemies=0] 
     * @param {number} [blueEnemies=0] 
     * @param {number} [redAmmo=0] 
     * @param {number} [greenAmmo=0] 
     * @param {number} [blueAmmo=0] 
     * 
     * @memberof WaveMenu
     */
    updateValues(waveNum = 0, redEnemies = 0, greenEnemies = 0, blueEnemies = 0, redAmmo = 0, greenAmmo = 0, blueAmmo = 0) {
        // Title
        this._title = `Wave ${waveNum}`;
        console.log(this._title);
        // Enemy composition
        this._redEnemies = `: ${redEnemies}`;
        this._greenEnemies = `: ${greenEnemies}`;
        this._blueEnemies = `: ${blueEnemies}`;
        // Ammo composition
        this._redAmmo = `: ${redAmmo}`;
        this._greenAmmo = `: ${greenAmmo}`;
        this._blueAmmo = `: ${blueAmmo}`;
    }

    destroy() {
        super.destroy()
    }
}

export default WaveMenu;