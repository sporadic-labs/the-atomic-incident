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
        if (this.visible) {
            globals.plugins.lighting.setOpacity(0.5);
        } else {            
            globals.plugins.lighting.setOpacity(1);
        }
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

    this._mouseLightText = game.make.text(30, 300, "Mouse in light: No", 
        textStyle);
    this.add(this._mouseLightText);
}

DebugDisplay.prototype.update = function () {
    this._satText.setText("Debug SAT: " + boolToOnOff(this._satDebug));
    this._lightsText.setText("Debug Lights: " + boolToOnOff(this._lightsDebug));

    // Check if mouse is in shadow
    var game = this.game;
    var mousePoint = new Phaser.Point(
        game.input.mousePointer.x + game.camera.x,
        game.input.mousePointer.y + game.camera.y
    );
    var inShadow = game.globals.plugins.lighting.isPointInShadow(mousePoint);
    this._mouseLightText.setText("Mouse in light: " + boolToYesNo(!inShadow));
};

function boolToOnOff(boolValue) {
    return boolValue ? "On" : "Off";
}

function boolToYesNo(boolValue) {
    return boolValue ? "Yes" : "No";
}