module.exports = Light;

function Light(game, parent, position, radius, color, 
	opacity) {
	this.game = game;
	this.parent = parent;
	this.position = position.clone();
	this.radius = radius;
	this.color = (color !== undefined) ? color : 0xFFFFFF;
	this.opacity = (opacity !== undefined) ? opacity : 1;
    this._isDebug = false;
    this._debugGraphics = null;
}

Light.prototype.enableDebug = function () {
    this._isDebug = true;
    if (!this._debugGraphics) {
        // Only create debug graphics if it is needed, for performance reasons
        this._debugGraphics = this.game.add.graphics(0, 0);
        this.parent.add(this._debugGraphics);
    } 
    this._debugGraphics.visible = true;
};

Light.prototype.disableDebug = function () {    
    this._isDebug = false;
    if (this._debugGraphics) this._debugGraphics.visible = false;
};

Light.prototype.update = function () {
    if (this._debugGraphics) this._updateDebug();
};

Light.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.lighting.removeLight(this);
};

Light.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(1, 0xFF00FF, 0.6);
    this._debugGraphics.beginFill(this.color, 0.4);
    this._debugGraphics.drawCircle(0, 0, this.radius);
    this._debugGraphics.endFill();
};