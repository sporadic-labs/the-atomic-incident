const Colors = require("../../constants/colors.js");

/**
 * Ammo Manager!
 * Keep track of current r/g/b ammo amounts.
 * Keep track of active ammo color.  Switch active ammo color on user input.
 * Update and render ammo amounts in HUD.
 * 
 * @class AmmoManager
 */
export class AmmoManager extends Phaser.Group {
    /**
     * Creates an instance of AmmoManager.
     * @param {any} game - Instance of game this Ammo Component is attached to. 
     * 
     * @memberOf AmmoManager
     */
    constructor(game, parentGroup) {
        super(game, parentGroup, "ammo-manager");

        this._ammo = {r: 0, g: 0, b: 0};

        const y = 70;
        const x = 34;
        const spacing = 31;
        const font = "30px 'Alfa Slab One'";
        this._text = {
            r: game.make.text(x, y, 0, {font, fill: Colors.red.getWebColor()}),
            g: game.make.text(x + (1 * spacing), y, 0, {font, fill: Colors.green.getWebColor()}),
            b: game.make.text(x + (2 * spacing), y, 0, {font, fill: Colors.blue.getWebColor()})
        };
        this.add(this._text.r);
        this._text.r.anchor.setTo(0.5);
        this.add(this._text.g);
        this._text.g.anchor.setTo(0.5);
        this.add(this._text.b);
        this._text.b.anchor.setTo(0.5);
        this._updateText();
    }

    isEmpty() {
        return (this._ammo.r > 0) || (this._ammo.g > 0) || (this._ammo.b > 0);
    }

    getAmmo() {
        return this._ammo;
    }

    getAmmoByColor(color) {
        if (color === Colors.red) return this._ammo.r;
        else if (color === Colors.green) return this._ammo.g;
        else if (color === Colors.blue) return this._ammo.b;
        else return null;
    }

    setAmmo({r = undefined, g = undefined, b = undefined}) {
        if (r !== undefined) this._ammo.r = r;
        if (g !== undefined) this._ammo.g = g;
        if (b !== undefined) this._ammo.b = b;
        this._updateText();
        return this;
    }

    incrementAmmo({r = 0, g = 0, b = 0}) {
        this._ammo.r += r;
        this._ammo.g += g;
        this._ammo.b += b;
        this._updateText();
        return this;
    }

    incrementAmmoByColor(color, delta) {
        if (color === Colors.red) this._ammo.r += delta;
        else if (color === Colors.green) this._ammo.g += delta;
        else if (color === Colors.blue) this._ammo.b += delta;
        this._updateText();
        return this;
    }

    destroy() {
        super.destroy();
    }

    _updateText() {
        this._text.r.setText(this._ammo.r);
        this._text.r.alpha = (this._ammo.r > 0) ? 1 : 0.6;
        this._text.g.setText(this._ammo.g);
        this._text.g.alpha = (this._ammo.g > 0) ? 1 : 0.6;
        this._text.b.setText(this._ammo.b);
        this._text.b.alpha = (this._ammo.b > 0) ? 1 : 0.6;
    }
}
