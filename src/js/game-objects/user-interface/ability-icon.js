class AbilityIcon extends Phaser.Group {
    /**
     * Creates an instance of AbilityIcon.
     * @param {Phaser.Game} game 
     * @param {any} x 
     * @param {any} y 
     * @param {any} parentGroup 
     * @param {any} frame 
     * 
     * @memberOf AbilityIcon
     */
    constructor(game, x, y, parentGroup, frame) {
        super(game, parentGroup, "ability-icon");
        this.position.set(x, y);

        this._icon = game.make.image(0, 0, "assets", frame);
        this._icon.alpha = 0.5;
        this.add(this._icon);

        this._croppedIcon = game.make.image(0, 0, "assets", frame);
        this.add(this._croppedIcon);
    }

    setTint(tint) {
        this._icon.tint = tint;
        this._croppedIcon.tint = tint; 
    }

    /** 
     * Crops the icon so that it is revealed from bottom to top.
     * 
     * @param {number} fractionMasked A number between 0 and 1
     * 
     * @memberOf AbilityIcon
     */
    updateMask(fractionMasked) {
        const cropAmount = fractionMasked * this._icon.height;
        const cropTop = this._icon.height - cropAmount;
        this._croppedIcon.crop(
            new Phaser.Rectangle(0, cropTop, this._icon.width, cropAmount)
        );
        this._croppedIcon.y = cropTop;
    }
}

module.exports = AbilityIcon;