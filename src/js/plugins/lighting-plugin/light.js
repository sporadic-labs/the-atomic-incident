module.exports = Light;

function Light(game, parent, position, radius, color) {
    this.game = game;
    this.parent = parent;
    this.position = position.clone();
    this.radius = radius;
    this.originalRadius = radius;
    this.color = (color !== undefined) ? color : 0xFFFFFFFF;
    this._isDebug = false;
    this._debugGraphics = null;
    this._noise = Simple1DNoise();
    this._noise.setScale(0.25);
    this._noise.setAmplitude(10);
    this._frameCount = 0;

    this._bitmap = game.add.bitmapData(2 * this.radius, 2 * this.radius);
    this._needsRedraw = true;
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
    // this.radius = this.originalRadius + this._noise.getVal(this._frameCount++);
    if (this._lastRadius !== this.radius || 
            !this._lastPosition.equals(this.position)) {
        this._needsRedraw = true;
    }
    this._lastRadius = this.radius;
    this._lastPosition = this.position.clone();
    if (this._debugGraphics) this._updateDebug();
};

Light.prototype.redraw = function (points) {
    // Light is expecting these points to be in world coordinates, since its own
    // position is in world coordinates
    if (this._needsRedraw) {
        // Clear offscreen buffer
        this._bitmap.cls();
        this.redrawLight();
        this.redrawShadow(points);      
        this._needsRedraw = false;  
    }
};

Light.prototype.redrawLight = function () {
    // Draw the circular gradient for the light. This is the light without
    // factoring in shadows
    this._bitmap.blendSourceOver(); // Default blend mode

    // Option 1: Smooth gradient approach
    // var gradient = this._bitmap.ctx.createRadialGradient(
    //     this.radius, this.radius, this.radius, 
    //     this.radius, this.radius, 0
    // );
    // var c1 = Phaser.Color.getRGB(this.color);
    // c1.a = 0;
    // var c2 = Phaser.Color.getRGB(this.color);
    // gradient.addColorStop(0, Phaser.Color.getWebRGB(c1));
    // gradient.addColorStop(0.75, Phaser.Color.getWebRGB(c2));
    // this._bitmap.circle(this.radius, this.radius, 
    //     Math.round(this.radius), gradient);
    
    // Option 2: Discrete rings of light, fading in transparency with distance 
    // from center 
    var c = Phaser.Color.getRGB(this.color);
    var c1 = Phaser.Color.getWebRGB(c);
    c.a = 175;
    var c2 = Phaser.Color.getWebRGB(c);
    c.a = 100;
    var c3 = Phaser.Color.getWebRGB(c);   
    this._bitmap.circle(this.radius, this.radius, Math.round(this.radius * 0.9), c3);
    this._bitmap.circle(this.radius, this.radius, Math.round(this.radius * 0.8), c2);
    this._bitmap.circle(this.radius, this.radius, Math.round(this.radius * 0.5), c1);
};

Light.prototype.redrawShadow = function (points) {
    // Destination in blend mode - the next thing drawn acts as a mask for the
    // existing canvas content
    this._bitmap.blendDestinationIn();

    // Draw the "light rays"
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = "white";
    this._bitmap.ctx.strokeStyle = "white";

    // Convert the world positions of the light points to local coordinates 
    // within the bitmap
    points.forEach(function (point) {
        point.subtract(this.position.x - this.radius, 
            this.position.y - this.radius);
    }, this);
    this._bitmap.ctx.moveTo(points[0].x, points[0].y);
    for(var i = 0; i < points.length; i++) {
        this._bitmap.ctx.lineTo(points[i].x, points[i].y);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();
};

Light.prototype.destroy = function () {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this.game.globals.plugins.lighting.removeLight(this);
};

Light.prototype._updateDebug = function () {
    this._debugGraphics.position.copyFrom(this.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(5, 0xFF00FF, 0.6);
    this._debugGraphics.drawCircle(0, 0, 2);
    this._debugGraphics.drawCircle(0, 0, 2 * this.radius);
};

var Simple1DNoise = function() {
    var MAX_VERTICES = 256;
    var MAX_VERTICES_MASK = MAX_VERTICES -1;
    var amplitude = 1;
    var scale = 1;

    var r = [];

    for ( var i = 0; i < MAX_VERTICES; ++i ) {
        r.push(Math.random());
    }

    var getVal = function( x ){
        var scaledX = x * scale;
        var xFloor = Math.floor(scaledX);
        var t = scaledX - xFloor;
        var tRemapSmoothstep = t * t * ( 3 - 2 * t );

        /// Modulo using &
        var xMin = xFloor & MAX_VERTICES_MASK;
        var xMax = ( xMin + 1 ) & MAX_VERTICES_MASK;

        var y = lerp( r[ xMin ], r[ xMax ], tRemapSmoothstep );

        return y * amplitude;
    };

    /**
    * Linear interpolation function.
    * @param a The lower integer value
    * @param b The upper integer value
    * @param t The value between the two
    * @returns {number}
    */
    var lerp = function(a, b, t ) {
        return a * ( 1 - t ) + b * t;
    };

    // return the API
    return {
        getVal: getVal,
        setAmplitude: function(newAmplitude) {
            amplitude = newAmplitude;
        },
        setScale: function(newScale) {
            scale = newScale;
        }
    };
};