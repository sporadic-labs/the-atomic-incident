/**
 * Base class for Modal Menus.
 * 
 * @class ModalMenu
 * @extends {Phaser.Group}
 */
class ModalMenu extends Phaser.Group {

    /**
     * @constructor
     * 
     * @param {any} game 
     * @param {any} group 
     * @param {string} groupKey 
     * @param {number} [x=0] 
     * @param {number} [y=0] 
     * @param {number} [width=420] 
     * @param {number} [height=360] 
     * @param {boolean} [center=true] 
     * 
     * @memberof ModalMenu
     */
    constructor(game, group, groupKey, x = 0, y = 0, width = 420, height = 360, center = true) {
        super(game, group, groupKey);
        this.game = game;

        // Shorthands
        var globals = game.globals;
        var SlickUI = globals.plugins.SlickUI;
        // Plugin instance
        var slickUI = globals.plugins.slickUI;

        // If the 'center' flag was set to true, disregard the position and center the modal.
        // Otherwise, use the position provided.
        x = center ? (game.width / 2) - (width / 2) : x;
        y = center ? (game.height / 2) - (height / 2) : y;
        // Add a panel that will serve as the Menu container.
        this.panel = new SlickUI.Element.Panel(x, y, width, height);
        slickUI.add(this.panel);

        /**
         * @member {array}
         * @memberof ModalMenu
         */
        this.rows = []

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
     * @memberof ModalMenu
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

    addRow() {
        // Shorthands
        const globals = this.game.globals;
        const SlickUI = globals.plugins.SlickUI;

        // Create a new title element, and add it to the panel.
        const row = new SlickUI.Element.Container(this.panel);
        this.panel.add(row);

        // Also add the row to the row array, for easy access later.
        this.rows.push(row);

        return row;
    }

    addGroup() {
        // Shorthands
        const globals = this.game.globals;
        const SlickUI = globals.plugins.SlickUI;

        // Create a new title element, and add it to the panel.
        const group = new SlickUI.Element.Container(this.panel);
        this.panel.add(group);

        return group;
    }

    addSprite(x = 0, y = 0, key = "assets", frame) {
        // Shorthands
        const globals = this.game.globals;
        const SlickUI = globals.plugins.SlickUI;

        // Create a new sprite, and add it to the panel.
        const newSprite = new SlickUI.Element.DisplayObject(x, y,
            this.game.make.sprite(0, 0, key, frame));
        this.panel.add(newSprite);

        return newSprite;
    }

    addText(msg, x = 0, y = 0, center = false) {
        // Shorthands
        const globals = this.game.globals;
        const SlickUI = globals.plugins.SlickUI;

        // Create a new text element, and add it to the panel.
        const text = new SlickUI.Element.Text(x, y, msg);
        // Add the new text element to the panel.
        this.panel.add(text);
        // If the center flag was passed in, center the text too.
        if (center) {
            text.centerHorizontally();
        }

        return text;
    }

    // Title is assumed to be centered.
    addTitle(msg, x = 0, y = 0) {
        const title = this.addText(msg, x, y, true);
        return title;
    }

    addButton(msg, x = 0, y = 0, center = false) {
        // Shorthands
        const globals = this.game.globals;
        const SlickUI = globals.plugins.SlickUI;

        // Create a new title element, and add it to the panel.
        const title = new SlickUI.Element.Text(x, y, msg);
        // If the center flag was passed in, center the title too.
        if (center) {
            title.centerHorizontally();
        }
        this.panel.add(title);

        return title;
    }


}

export default ModalMenu;