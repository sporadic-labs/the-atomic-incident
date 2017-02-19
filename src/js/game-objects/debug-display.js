module.exports = DebugDisplay;

DebugDisplay.prototype = Object.create(Phaser.Group.prototype);

function DebugDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "debug-display");
    this.fixedToCamera = true;

    var globals = this.game.globals;

    // Transparent overlay
    this._graphics = game.make.graphics(0, 0);
    this._graphics.beginFill(0x000, 0.6);
    this._graphics.drawRect(0, 0, game.width, game.height);
    this.add(this._graphics);
    
    // Toggle the debug menu
    var debugToggleKey = game.input.keyboard.addKey(Phaser.Keyboard.E);
    this.visible = false;
    debugToggleKey.onDown.add(function () {
        this.visible = !this.visible;
    }, this);

    var textStyle = {
        font: "32px Arial",
        fill: "#9C9C9C",
        align: "left"
    };

    this._satText = game.make.text(30, 200, "Debug SAT: false", textStyle);
    this.add(this._satText);
    this._satText.inputEnabled = true;
    this._satDebug = globals.plugins.satBody.isDebugAllEnabled();
    this._satText.events.onInputDown.add(function () {
        this._satDebug = !this._satDebug;
        if (this._satDebug) globals.plugins.satBody.enableDebugAll();
        else globals.plugins.satBody.disableDebugAll();
    }, this);

    this._lightsText = game.make.text(30, 250, "Debug Lights: false", textStyle);
    this.add(this._lightsText);
    this._lightsText.inputEnabled = true;
    this._lightsDebug = false;
    this._lightsText.events.onInputDown.add(function () {
        this._lightsDebug = !this._lightsDebug;
        if (this._lightsDebug) globals.plugins.lighting.enableDebug();
        else globals.plugins.lighting.disableDebug();
    }, this);
}

DebugDisplay.prototype.update = function () {
    this._satText.setText("Debug SAT: " + boolToOnOff(this._satDebug));
    this._lightsText.setText("Debug Lights: " + boolToOnOff(this._lightsDebug));
};

function boolToOnOff(boolValue) {
    return boolValue ? "On" : "Off";
}