class WaveMeter extends Phaser.Group {

    /**
     * Creates an instance of WaveMeter.
     * @param {Phaser.Game} game
     * @param {any} waveManager
     *
     * @memberof WaveMeter
     */
    constructor(game, waveManager) {
        super(game, game.globals.groups.hud, "WaveMeter");
        this._waveManager = waveManager;

        this._width = 300;
        this._height = 30;
        this._secondsInMeter = 15; // The timeslice that the meter visualizes, e.g. the next 20s

        this._graphics = game.make.graphics(
            game.width / 2 - this._width / 2,
            game.height - this._height - 20
        );
        this.add(this._graphics);
    }

    update() {
        this._redraw();
    }

    _redraw() {
        this._graphics.clear();
        this._graphics.lineStyle(0);
        this._graphics.beginFill(0x000);
        this._graphics.drawRect(0, 0, this._width, this._height);

        const startSeconds = this._waveManager.getSeconds(); // Time at the start of the meter
        const endSeconds = startSeconds + this._secondsInMeter; // Time at the end of the meter

        for (const wave of this._waveManager.getWaves()) {
            // Skip if the wave has passed or is too far in the future
            if ((wave.endTime <= startSeconds) || (wave.startTime >= endSeconds)) continue;
            // Otherwise, check each enemy group in the wave to see if it should be drawn
            for (const group of wave.enemyGroups) {
                const groupTime = wave.startTime + wave.delay + group.time;
                // Is this group within the time window of the wave meter?
                if (groupTime >= startSeconds && groupTime <= endSeconds) {
                    // Find position of the group along the bar (number between 0 and 1)
                    const positionFraction = (groupTime - startSeconds) / this._secondsInMeter;
                    this._drawGroup(positionFraction, group);
                }
            }
        }
    }

    /**
     * @param {number} positionFraction Number between 0 and 1 representing where a group is on the
     * wave meter.
     * @param {Object} enemyGroup Enemy group representation from the WaveManager
     *
     * @memberof WaveMeter
     */
    _drawGroup(positionFraction, enemyGroup) {
        const color = enemyGroup.composition.getColor().getRgbColorInt();
        const diameter = 0.75 * this._height;
        const radius = diameter / 2;
        // Fudge factor: adjust the mapping so that a each circle stays inside edges of the bar
        const x = (positionFraction * (this._width - diameter)) + radius;
        const y = this._height / 2;
        this._graphics.beginFill(color);
        this._graphics.drawCircle(x, y, diameter);
        this._graphics.endFill();
    }
}

export default WaveMeter;