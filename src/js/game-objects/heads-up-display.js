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

    // Pulse cooldown icon
    this._pulseIcon = game.make.image(20, 50, "assets", "hud/pulse");
    this.add(this._pulseIcon);

    // Pulse inactive cooldown icon w/ mask.
    this._pulseIconOff = game.make.image(20, 50, "assets", "hud/pulse");
    this._pulseIconOff.tint = 0x636363;
    var pulseMask = game.add.graphics(0,0);
    pulseMask.beginFill();
    pulseMask.drawRect(29, 49, 0, 0);
    pulseMask.endFill();
    this._pulseIconOff.mask = pulseMask;
    this.add(this._pulseIconOff);

    // Dash cooldown icon
    this._dashIcon = game.make.image(50, 50, "assets", "hud/dash");
    this.add(this._dashIcon);

    // Dash inactive cooldown icon w/ mask
    this._dashIconOff = game.make.image(50, 50, "assets", "hud/dash");
    this._dashIconOff.tint = 0x636363;
    var dashMask = game.add.graphics(0,0);
    dashMask.beginFill();
    dashMask.drawRect(49, 49, 0, 0);
    dashMask.endFill();
    this._dashIconOff.mask = pulseMask;
    this.add(this._dashIconOff);

    // Play/pause
    const unpause = () => {
        pauseButton.visible = true;
        playButton.visible = false;
        game.paused = false;
        this.game.input.onDown.remove(unpause, this);
    }
    const playPos = new Phaser.Point(game.width - 10, game.height - 10); 
    const pauseButton = game.add.button(playPos.x, playPos.y, "assets", () => {
        playButton.visible = true;
        pauseButton.visible = false;
        this.game.input.onDown.add(unpause, this);
        game.paused = true;
    }, this, "hud/play", "hud/play", "hud/play", "hud/play");
    pauseButton.anchor.set(1, 1);
    const playButton = game.add.button(playPos.x, playPos.y, "assets", unpause, this, 
        "hud/pause", "hud/pause", "hud/pause", "hud/pause");
    playButton.anchor.set(1, 1);
    playButton.visible = false;

    // Mute/unmute
    const mutePos = new Phaser.Point(game.width - 10, 10); 
    const muteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
        unmuteButton.visible = true;
        muteButton.visible = false;
        game.sound.mute = true;
    }, this, "hud/mute", "hud/mute", "hud/mute", "hud/mute");
    muteButton.anchor.set(1, 0);
    const unmuteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
        unmuteButton.visible = false;
        muteButton.visible = true;
        game.sound.mute = false;
    }, this, "hud/sound", "hud/sound", "hud/sound", "hud/sound");
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

    // Set the color of the pulse icon based on the first color in the players ammo pack.
    if (this._player.ammo.length > 0) {
        this._pulseIcon.tint = this._player.ammo[0].getRgbColorInt();
    } else {
        this._pulseIcon.tint = 0x363636;
    }

    // Check if the pulse ability is ready.  If it isn't, the cooldown should be animating.
    if (!this._player._pulseAbility.isReady()) {
        // Clear the mask...
        this._pulseIconOff.mask.clear();
        this._pulseIconOff.mask.beginFill();
        // Calculate new dimensions based on the progress.
        var p = (this._player._pulseAbility.progress() * 34);
        // Draw the mask.
        this._pulseIconOff.mask.drawRect(19, 49, 32, p);
        this._pulseIconOff.mask.endFill();
    }
    // Check if the dash ability is ready.  If it isn't, the cooldown should be animating.
    if (!this._player._dashAbility.isReady()) {
        // Clear the mask...
        this._dashIconOff.mask.clear();
        this._dashIconOff.mask.beginFill();
        // Calculate new dimensions based on the progress.
        var d = (this._player._dashAbility.progress() * 34);
        // Draw the mask.
        this._dashIconOff.mask.drawRect(49, 49, 32, d);
        this._dashIconOff.mask.endFill();
    }
};


// Health bar helper class
function HealthBar(game, x, y, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "health-bar");
    this.x = x;
    this.y = y; 
    this._player = this.game.globals.player;
    this._fullHeartName = "hud/heart";
    this._emptyHeartName = "hud/heart-open";

    this._hearts = [
        game.make.image(0, 0, "assets", this._fullHeartName),
        game.make.image(30, 0, "assets", this._fullHeartName),
        game.make.image(60, 0, "assets", this._fullHeartName)
    ];
    for (var i = 0; i < this._hearts.length; i++) this.add(this._hearts[i]);
}

HealthBar.prototype = Object.create(Phaser.Group.prototype);

HealthBar.prototype.update = function () {
    var numHearts = this._player.hearts;
    for (var i = 0; i < this._hearts.length; i++) {
        if (i < numHearts) this._hearts[i].frameName = this._fullHeartName;
        else this._hearts[i].frameName = this._emptyHeartName;
    }
};