const Color = require("../../helpers/Color.js");
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
        super(game, parentGroup, "ammo-manager")

        this.game = game;
        this._player = game.globals.player;

        /**
         * @member { Color } _activeAmmoType - Defaults to red.
         */
        this._activeAmmoType = Colors.red;
        /**
         * @member { number } _redAmmoAmt
         */
        this._redAmmoAmt = 0;
        /**
         * @member { number } _greenAmmoAmt
         */
        this._greenAmmoAmt = 0;
        /**
         * @member { number } _blueAmmoAmt
         */
        this._blueAmmoAmt = 0;


        // Text for HUD
        // Graphic for highlighting active ammo type.
        const bitmap = game.add.bitmapData(game.width, game.height);
        bitmap.circle(34, 107, 20, Colors.red.getWebColor());
        /**
         * @member { Phaser.BitmapData } _bitmap
         */
        this._bitmap = bitmap;
        const sprite = game.add.sprite(0, 0, bitmap);
        /**
         * @member { Phaser.Sprite } _sprite
         */
        this._sprite = sprite;
        this.add(sprite);
        /**
         * @member { Phaser.Text } _rText
         */
        // NOTE(rex): Should this be set dynamically instead?
        this._rText = game.make.text(34, 112, this._redAmmoAmt, {
            font: "30px 'Alfa Slab One'", fill: Colors.white.getWebColor(), align: "left"
        });
        this._rText.anchor.setTo(0.5);
        this.add(this._rText);
        /**
         * @member { Phaser.Text } _gText
         */
        this._gText = game.make.text(68, 112, this._greenAmmoAmt, {
            font: "30px 'Alfa Slab One'", fill: Colors.green.getWebColor(), align: "left"
        });
        this._gText.anchor.setTo(0.5);
        this.add(this._gText);
        /**
         * @member { Phaser.Text } _bText
         */
        this._bText = game.make.text(102, 112, this._blueAmmoAmt, {
            font: "30px 'Alfa Slab One'", fill: Colors.blue.getWebColor(), align: "left"
        })
        this._bText.anchor.setTo(0.5);
        this.add(this._bText);

        /**
         * @member { Phaser.Keyboard } _inputs
         */
        this._inputs = game.input.keyboard;
        const K = Phaser.Keyboard;
        // Register keys 1, 2, 3 to set the active ammo type when pressed.
        const redKey = this._inputs.addKey(K.ONE)
        redKey.onDown.add(() => this.activeAmmo = Colors.red);
        const greenKey = this._inputs.addKey(K.TWO)
        greenKey.onDown.add(() => this.activeAmmo = Colors.green);
        const blueKey = this._inputs.addKey(K.THREE)
        blueKey.onDown.add(() => this.activeAmmo = Colors.blue);
    }

    update() {
        super.update()
    }

    destroy() {
        super.destroy()
    }

    /**
     * @method activeAmmo
     * @param { Color } newAmmo
     * 
     * @memberof AmmoManager
     */
    set activeAmmo(newAmmo) {
        // Check if the value passed in is a color, otherwise use the Color constructor.
        const a = newAmmo instanceof Color ? newAmmo : new Color(newAmmo);
        this._activeAmmoType = a;

        // Update the HUD text
        this._bitmap.cls();
        this._rText.addColor(Colors.red.getWebColor(), 0);
        this._gText.addColor(Colors.green.getWebColor(), 0);
        this._bText.addColor(Colors.blue.getWebColor(), 0);
        switch (this._activeAmmoType) {
            case Colors.red:
                this._bitmap.circle(34, 107, 20, Colors.red.getWebColor());
                this._rText.addColor(Colors.white.getWebColor(), 0);
                break;
            case Colors.green:
                this._bitmap.circle(68, 107, 20, Colors.green.getWebColor());
                this._gText.addColor(Colors.white.getWebColor(), 0);
                break;
            case Colors.blue:
                this._bitmap.circle(102, 107, 20, Colors.blue.getWebColor());
                this._bText.addColor(Colors.white.getWebColor(), 0);
                break;
        }
    }
    get activeAmmo() {
        return this._activeAmmoType;
    }
 
    /**
     * @method redAmmo
     * @param {number } amt - Number of bullets to add to the red ammo variable.
     * 
     * @memberof AmmoManager
     */
    set redAmmo(amt) {
        this._redAmmoAmt = amt;
    }
    get redAmmo() {
        return this._redAmmoAmt;
    }

    /**
     * @method blueAmmo
     * @param { number } amt - Number of bullets to add to the blue ammo variable.
     * 
     * @memberof AmmoManager
     */
    set blueAmmo(amt) {
        this._blueAmmoAmt = amt;
    }
    get blueAmmo() {
        return this._blueAmmoAmt;
    }

    /**
     * @method greenAmmo
     * @param { number } amt - Number of bullets to add to the green ammo variable.
     * 
     * @memberof AmmoManager
     */
    set greenAmmo(amt) {
        this._greenAmmoAmt = amt;
    }
    get greenAmmo() {
        return this._greenAmmoAmt;
    }

    /**
     * @method ammo
     * @returns { number } Amount of ammo for the active ammo type.
     * 
     * @memberof AmmoManager
     */
    ammo() {
        switch (this._activeAmmoType) {
            case Colors.red:
                return this._redAmmoAmt;
            case Colors.green:
                return this._greenAmmoAmt;
            case Colors.blue:
                return this._blueAmmoAmt;
        }
    }

    /**
     * Easily set new amounts of RGB ammo.
     * 
     * @method addAllAmmo
     * @param { number } r 
     * @param { number } g 
     * @param { number } b 
     * 
     * @memberof AmmoManager
     */
    addAllAmmo(r, g, b) {
        this.redAmmo = r;
        this.greenAmmo = g;
        this.blueAmmo = b;
        this._rText.setText(this._redAmmoAmt);
        this._gText.setText(this._greenAmmoAmt);
        this._bText.setText(this._blueAmmoAmt);
    }

    /**
     * Easily set new amounts of RGB ammo.
     * 
     * @method addAmmo
     * @param { Color } color 
     * @param { number } [amt=1]
     * 
     * @memberof AmmoManager
     */
    addAmmo(color, amt = 1) {
        // First make sure the param is an instance of Color.
        const c = color instanceof Color ? color : new Color(color);
        const isAmmoEmpty = (this._redAmmoAmt + this._greenAmmoAmt + this._blueAmmoAmt) === 0; 
        // Then update the color ammo amount based on the number passed in.
        if (c === Colors.red) {
            this._redAmmoAmt += amt ? amt : 1;
            if (isAmmoEmpty) this.activeAmmo = Colors.red;
        } else if (c === Colors.green) {
            this._greenAmmoAmt += amt ? amt : 1;
            if (isAmmoEmpty) this.activeAmmo = Colors.green;
        } else if (c === Colors.blue) {
            this._blueAmmoAmt += amt ? amt : 1;
            if (isAmmoEmpty) this.activeAmmo = Colors.blue;
        }
        // Update ammo HUD text with new numbers.
        this._rText.setText(this._redAmmoAmt);
        this._gText.setText(this._greenAmmoAmt);
        this._bText.setText(this._blueAmmoAmt);
    }

    /**
     * @method addRed
     * @param {number} amt - Defaults to 1 if not provided
     * 
     * @memberof AmmoManager
     */
    addRed(amt) {
        this._redAmmoAmt += amt ? amt : 1;
        this._rText.setText(this._redAmmoAmt);
    }

    /**
     * @method addGreen
     * @param {number} amt - Defaults to 1 if not provided
     * 
     * @memberof AmmoManager
     */
    addGreen(amt) {
        this._greenAmmoAmt += amt ? amt : 1;
        this._gText.setText(this._greenAmmoAmt);
    }

    /**
     * @method addBlue
     * @param {number} amt - Defaults to 1 if not provided
     * 
     * @memberof AmmoManager
     */
    addBlue(amt) {
        this._blueAmmoAmt += amt ? amt : 1;
        this._bText.setText(this._blueAmmoAmt);
    }

    /**
     * Remove ammo based on the current active ammo type.
     * 
     * @method shoot
     * @param {number} amt - Defaults to 1 if not provided
     * 
     * @memberof AmmoManager
     */
    shoot(amt) {
        // If there is no ammo for the active type, you can't shoot.  So bail!
        if (this.ammo() <= 0) return;
        // If the requested amount is more than what is available, use what remains.
        if (amt && this.ammo() - amt < 0) {
            amt = this.ammo() - amt;
        }

        switch (this._activeAmmoType) {
            case Colors.red:
                this._redAmmoAmt -= amt ? amt : 1;
                this._rText.setText(this._redAmmoAmt);
                break;
            case Colors.green:
                this._greenAmmoAmt -= amt ? amt : 1;
                this._gText.setText(this._greenAmmoAmt);
                break;
            case Colors.blue:
                this._blueAmmoAmt -= amt ? amt : 1;
                this._bText.setText(this._blueAmmoAmt);
                break;
        }
    }

}
