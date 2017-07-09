const HealthBar = require("./user-interface/health-bar");
const AbilityIcon = require("./user-interface/ability-icon");
// const AbilityNames = require("../constants/ability-names");

import PauseMenu from "./user-interface/pause-menu";

module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

/**
 * @param {Phaser.Game} game
 * @param {Phaser.Group} parentGroup
 */
function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");

    this.game = game;
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;
    this.fixedToCamera = true;

    new HealthBar(game, 20, 15, this);

    // this._pulseIcon = new AbilityIcon(game, 20, 50, this, "hud/pulse");
    // this._dashIcon = new AbilityIcon(game, 53, 50, this, "hud/dash");
    // this._slowIcon = new AbilityIcon(game, 86, 50, this, "hud/slow-motion");
    // this._ghostIcon = new AbilityIcon(game, 119, 50, this, "hud/ghost");

    // Play/pause
    const unpause = () => {
        pauseButton.visible = true;
        playButton.visible = false;
    }
    const playPos = new Phaser.Point(game.width - 10, game.height - 10);
    const pauseButton = game.add.button(playPos.x, playPos.y, "assets", () => {
        playButton.visible = true;
        pauseButton.visible = false;
        const menu = new PauseMenu(game);
        menu.unpauseSignal.add(unpause);
    }, this, "hud/pause", "hud/pause", "hud/pause", "hud/pause");
    pauseButton.anchor.set(1, 1);
    const playButton = game.add.button(playPos.x, playPos.y, "assets", unpause, this,
        "hud/play", "hud/play", "hud/play", "hud/play");
    playButton.anchor.set(1, 1);
    playButton.visible = false;

    // Mute/unmute
    const mutePos = new Phaser.Point(game.width - 10, 10);
    const muteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
        unmuteButton.visible = true;
        muteButton.visible = false;
        game.sound.mute = true;
    }, this, "hud/sound", "hud/sound", "hud/sound", "hud/sound");
    muteButton.anchor.set(1, 0);
    const unmuteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
        unmuteButton.visible = false;
        muteButton.visible = true;
        game.sound.mute = false;
    }, this, "hud/mute", "hud/mute", "hud/mute", "hud/mute");
    unmuteButton.anchor.set(1, 0);
    // Show the appropriate button based on sound manager's state
    if (game.sound.mute) muteButton.visible = false;
    else unmuteButton.visible = false;

    // Text for HUD
    this._scoreText = game.make.text(this.game.width / 2, 34, "", {
        font: "30px 'Alfa Slab One'", fill: "#ffd800", align: "center"
    });
    this._scoreText.anchor.setTo(0.5);
    this.add(this._scoreText);

    this._debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
        font: "18px 'Alfa Slab One'", fill: "#9C9C9C", align: "left"
    });
    this._debugText.anchor.set(0, 1);
    this.add(this._debugText);

    this._fpsText = game.make.text(15, game.height - 25, "60", {
        font: "18px 'Alfa Slab One'", fill: "#9C9C9C", align: "left"
    })
    this._fpsText.anchor.set(0, 1);
    this.add(this._fpsText);
}

HeadsUpDisplay.prototype.update = function () {
    this._scoreText.setText(this.game.globals.scoreKeeper.getScore());
    Phaser.Group.prototype.update.apply(this, arguments);

    this._fpsText.setText(this.game.time.fps);

    // this._dashIcon.alpha = 0.1;
    // this._slowIcon.alpha = 0.1;
    // this._ghostIcon.alpha = 0.1;
    // if (this._player._activeAbility && this._player._activeAbility.isReady()) {
    //     switch (this._player._activeAbility.name) {
    //         case AbilityNames.DASH:
    //             this._dashIcon.alpha = 1;
    //             break;
    //         case AbilityNames.SLOW_MOTION:
    //             this._slowIcon.alpha = 1;
    //             break;
    //         case AbilityNames.GHOST:
    //             this._ghostIcon.alpha = 1;
    //             break;
    //         default:
    //             break;
    //     }
    // }

    Phaser.Group.prototype.update.apply(this, arguments);
};