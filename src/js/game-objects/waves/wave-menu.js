const colors = require("../../constants/colors");

let color = {
    h: 1,
    s: 1,
    l: 0.5,
    a: 1
};

class WaveMenu extends Phaser.Group {

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
        var slickUI = globals.plugins.slickUI;
        var SlickUI = globals.plugins.SlickUI;

        // Add a panel that will serve as the Menu container.
        var panel = new SlickUI.Element.Panel((game.width * 0.5) - (game.width * 0.25), game.height * 0.12, game.width * 0.5, 
            game.height / 4);
        slickUI.add(panel);
        // Shorthand for panel dimensions
        const spacing = 4;
        const pH = (panel.height / 10) + spacing;
        const pW = panel.width / 2;

        // Add some things to the panel.
        // Title w/ Current Wave Number
        const title = new SlickUI.Element.Text(0, pH, `Wave ${this._currentWaveIndex + 1}`);
        panel.add(title).centerHorizontally().text.alpha = 0.5;
        this._title = title;

        // Enemy composition
        const redEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 2,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(redEnemySprite);
        const redEnemies = new SlickUI.Element.Text(pW, pH * 2, `: 1`);
        panel.add(redEnemies);
        this._redEnemies = redEnemies;

        const greenEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 3,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(greenEnemySprite);
        const greenEnemies = new SlickUI.Element.Text(pW, pH * 3, `: 1`);
        panel.add(greenEnemies);
        this._greenEnemies = greenEnemies;

        const blueEnemySprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 4,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(blueEnemySprite);
        const blueEnemies = new SlickUI.Element.Text(pW, pH * 4, `: 1`);
        panel.add(blueEnemies);
        this._blueEnemies = blueEnemies;

        // Ammo composition
        const redAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 5,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(redAmmoSprite);
        const redAmmo = new SlickUI.Element.Text(pW, pH * 5, `: 1`);
        panel.add(redAmmo);
        this._redAmmo = redAmmo;

        const greenAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 6,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(greenAmmoSprite);
        const greenAmmo = new SlickUI.Element.Text(pW, pH * 6, `: 1`);
        panel.add(greenAmmo);
        this._greenAmmo = greenAmmo;

        const blueAmmoSprite = new SlickUI.Element.DisplayObject(pW - 36, pH * 7,
            game.make.sprite(0, 0, "assets", "enemies/circle-idle"));
        panel.add(blueAmmoSprite);
        const blueAmmo = new SlickUI.Element.Text(pW, pH * 7, `: 1`);
        panel.add(blueAmmo);
        this._blueAmmo = blueAmmo;
    }

    update() {}

    /**
     * Setup the content of the Wave Menu.
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
    setupMenu(waveNum = 0, redEnemies = 0, greenEnemies = 0, blueEnemies = 0, redAmmo = 0, greenAmmo = 0, blueAmmo = 0) {
        // Title
        this._title = `Wave ${waveNum}`;
        // Enemy composition
        this._redEnemies = `: ${redEnemies}`;
        this._greenEnemies = `: ${greenEnemies}`;
        this._blueEnemies = `: ${blueEnemies}`;
        // Ammo composition
        this._redAmmo = `: ${redAmmo}`;
        this._greenAmmo = `: ${greenAmmo}`;
        this._blueAmmo = `: ${blueAmmo}`;
    }

    show() {}

    hide() {}

    destroy() {
        super.destroy()
    }
}

export default WaveMenu;