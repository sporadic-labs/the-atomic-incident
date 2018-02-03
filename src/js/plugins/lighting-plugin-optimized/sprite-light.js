import Color from "../../helpers/color";

let instances = 0;

export default class Light {
  /**
   * Creates an instance of Light.
   * @param {Phaser.Game} game
   * @param {Phaser.Group} parent
   * @param {Phaser.Point} position
   * @param {Phaser.Circle|Phaser.Polygon} shape
   * @param {Color|hex} color
   *
   * @memberof Light
   */
  constructor(game, parent, position, shape, baseColor, pulseColor) {
    this.game = game;
    this.parent = parent;
    this.shape = shape;
    this.position = position.clone();
    this.baseColor = baseColor instanceof Color ? baseColor : new Color(baseColor);
    this.pulseColor = pulseColor instanceof Color ? pulseColor : new Color(pulseColor);
    this.enabled = true;
    this.needsRedraw = true;
    this.id = instances++;
    this._isDebug = false;
    this.rotation = 0;
    this.intersectingWalls = this._recalculateWalls();
    this.shape = null;
    this._lastRotation = this.rotation;
    this._lastPosition = position.clone();
    this._lastColor = this.baseColor.clone();
    this._pulse = null;
    this._pulseTween = null;
    this._bitmap = null;
    this._boundingRadius = null;
    this._debugGraphics = null;
    this.setShape(shape);

    // Don't trim - messes up the centering for some reason
    // Tint breaks the animation...
    this._sprite = this.game.add.sprite(0, 0, "echo-light");
    // this._sprite = this.game.add.sprite(0, 0, "glow-light");
    this._sprite.animations.add("glow", null, 30, true);
    this._sprite.animations.play("glow");
    this._sprite.anchor.set(0.5);
    this._sprite.x = this._bitmap.width / 2;
    this._sprite.y = this._bitmap.height / 2;
    this._sprite.autoCull = false;
    this._sprite.renderable = false;
  }

  setShape(shape) {
    this.shape = shape;

    // Figure out the appropriate bounding radius and bitmap size depending on the shape
    let bitmapWidth = 0;
    let bitmapHeight = 0;
    let boundingRadius = 0;
    if (shape instanceof Phaser.Circle) {
      // For a circlular light, the bitmap is set to be the size of the circle. The light should
      // then be drawn in the center of the bitmap.
      bitmapWidth = shape.diameter;
      bitmapHeight = shape.diameter;
      boundingRadius = shape.radius;
    } else if (shape instanceof Phaser.Polygon) {
      // For a polygon light, the bitmap is set to be the size of bounding circle around the
      // polygon. That means that the polygon can rotate without a point going beyond the bitmap.
      // That also means that we need to make sure the polygon's scale doesn't get increased
      // anywhere!
      const points = shape.toNumberArray();
      // Cache the original shape for the purposes of rotating
      this._originalShape = shape.clone();
      this._originalPoints = [];
      const center = new Phaser.Point(0, 0); // Points are relative to (0, 0)
      // Convert the points to Phaser.Point and find the bounding radius
      for (let i = 0; i < points.length; i += 2) {
        const p = new Phaser.Point(points[i], points[i + 1]);
        this._originalPoints.push(p);
        const d = center.distance(p);
        if (d > this._boundingRadius) boundingRadius = d;
      }
      bitmapWidth = 2 * this._boundingRadius;
      bitmapHeight = 2 * this._boundingRadius;
      this._setRotation(0);
    } else {
      throw Error("Unsupported shape used with Light");
    }

    // Update the bounding radius and bitmap dimensions
    this._boundingRadius = boundingRadius;
    if (this._bitmap) this._bitmap.resize(bitmapWidth, bitmapHeight);
    else this._bitmap = this.game.add.bitmapData(bitmapWidth, bitmapHeight);
    this.needsRedraw = true; // Flag as dirty
  }

  enableDebug() {
    this._isDebug = true;
    // Only create debug graphics if it is needed, for performance reasons
    this._debugGraphics = this.game.add.graphics(0, 0);
    this.parent.add(this._debugGraphics);
  }

  disableDebug() {
    this._isDebug = false;
    if (this._debugGraphics) {
      this._debugGraphics.destroy();
      this._debugGraphics = null;
    }
  }

  update() {
    if (!this.enabled) return; // Exit if light is disabled

    // Check for changes that require a redraw
    if (this._lastRotation !== this.rotation) {
      this._setRotation(this.rotation);
      this._lastRotation = this.rotation;
      this.needsRedraw = true;
    }
    if (!this._lastPosition.equals(this.position)) {
      this._lastPosition.copyFrom(this.position);
      this.needsRedraw = true;
    }
    if (!this._lastColor.rgbaEquals(this.baseColor)) {
      this._lastColor = this.baseColor.clone();
      this.needsRedraw = true;
    }
    if (this.isPulseActive()) this.needsRedraw = true;

    // If a redraw is needed, recalculate the walls
    if (this.needsRedraw) this.intersectingWalls = this._recalculateWalls();

    if (this._debugGraphics) this._updateDebug();

    // Always redraw
    this.needsRedraw = true;
  }

  /**
   * Check if a given world point is in the light cast by this light.
   *
   * @param {Phaser.Point} worldPosition World point to check
   * @returns {boolean}
   *
   * @memberof Light
   */
  isPointInLight(worldPosition) {
    if (!this.enabled) return false; // Exit if light is disabled
    // Check if the position is within range of the light's shape
    const lightRelativePos = Phaser.Point.subtract(worldPosition, this.position);
    const inShape = this.shape.contains(lightRelativePos.x, lightRelativePos.y);
    if (!inShape) return false;

    // If position is in the shape, do the more detailed work of checking the appropriate pixel in
    // the light's bitmap
    const bitmapPos = this.getTopLeft();
    const bitmapRelativePos = Phaser.Point.subtract(worldPosition, bitmapPos);
    // Round to pixel position
    bitmapRelativePos.x = Math.round(bitmapRelativePos.x);
    bitmapRelativePos.y = Math.round(bitmapRelativePos.y);
    // If point is outside of light's bitmap, return false
    if (
      bitmapRelativePos.x < 0 ||
      bitmapRelativePos.y < 0 ||
      bitmapRelativePos.x > this._bitmap.width ||
      bitmapRelativePos.y > this._bitmap.height
    ) {
      return false;
    }
    const color = this._bitmap.getPixel(bitmapRelativePos.x, bitmapRelativePos.y);
    if (color.r !== 0 || color.g !== 0 || color.b !== 0) return true;
    return false;
  }

  /**
   * Returns whether or not a pulse is currently running
   *
   * @returns {boolean}
   *
   * @memberof Light
   */
  isPulseActive() {
    return this._pulseTween && this._pulseTween.isRunning;
  }

  /**
   * Check if a point is in the pulse of the current light.
   *
   * @param {Phaser.Point} worldPosition World point to check
   * @returns {boolean}
   */
  isPointInPulse(worldPosition) {
    // Exit if light is disabled or there is no pulse
    if (!this.enabled || !this._pulseTween) return false;
    // Check if the position is within the arc of the pulse
    const dist = Phaser.Point.distance(worldPosition, this.position);
    const outerRadius = this._pulse.position;
    const innerRadius = this._pulse.position - this._pulse.width;
    if (dist > outerRadius || dist < innerRadius) return false;
    // Finally, check if the point is actually in light (and not in shadow)
    return this.isPointInLight(worldPosition);
  }

  /**
   *
   *
   * @param {number} [speed=400] Speed of the pulse expansion in pixels/second
   * @param {number} [width=75] Width of the pulse band in pixels
   *
   * @memberof Light
   */
  startPulse(speed = 400, width = 75) {
    if (this._pulseTween) this._pulseTween.stop();
    this._pulse = {
      position: 0, // position of the outer edge of the pulse
      color: this.pulseColor.getWebColor(),
      width
    };
    const duration = this._boundingRadius / speed * 1000;
    const endPosition = this._boundingRadius + width;
    this._pulseTween = this.game.add
      .tween(this._pulse)
      .to({ position: endPosition }, duration, Phaser.Easing.Linear.None)
      .to({ position: endPosition }, 0)
      .start();
    // Note: adding an extra 0s tween to keep the tween going 1x frame past when it would normally
    // end. This gives update a chance to catch up and draw the final tweened value before the tween
    // is no longer running (which stops the light from redrawing).
  }

  /**
   * Get a ray that starts at the position of the light and terminates at the edge
   * of the light's shape.
   *
   * @param {number} angle Angle in radians to cast the light
   * @returns {Phaser.Line} Line representing the ray
   *
   * @memberof Light
   */
  getLightRay(angle) {
    const ray = new Phaser.Line(this.position.x, this.position.y, 0, 0);
    if (this.shape instanceof Phaser.Circle) {
      ray.end.setTo(
        this.position.x + Math.cos(angle) * this.shape.radius,
        this.position.y + Math.sin(angle) * this.shape.radius
      );
      return ray;
    } else if (this.shape instanceof Phaser.Polygon) {
      // Hacky for now: cast the ray beyond the polygon's shape. See logic from old rectangle shape
      // code in this commit: e7063dc40a5afe5fef0167a7f14ed30d4ccbf45a
      ray.end.setTo(
        this.position.x + Math.cos(angle) * this._boundingRadius,
        this.position.y + Math.sin(angle) * this._boundingRadius
      );
      return ray;
    }
  }

  redraw(points) {
    // Light is expecting these points to be in world coordinates, since its own position is in
    // world coordinates
    if (this.needsRedraw) {
      // Clear offscreen buffer
      this._redrawLight();
      this._redrawShadow(points);
      this.needsRedraw = false;
      this._bitmap.update(); // Update bitmap so that pixels can be queried
    }
  }

  /**
   * Return the world coordinate of the top left corner of the bitmap.
   *
   * @returns {Phaser.Point} Top left of the bitmap
   *
   * @memberof Light
   */
  getTopLeft() {
    if (this.shape instanceof Phaser.Circle) {
      return new Phaser.Point(
        this.position.x - this.shape.radius,
        this.position.y - this.shape.radius
      );
    } else if (this.shape instanceof Phaser.Polygon) {
      // Polygon bitmap is set to be the size of the bounding circle. The light's position is
      // in the center of the bitmap, so to get from the position to the top left, simply
      // shift by the circle radius.
      return new Phaser.Point(
        this.position.x - this._boundingRadius,
        this.position.y - this._boundingRadius
      );
    }
  }

  destroy() {
    if (this._debugGraphics) this._debugGraphics.destroy();
    this._bitmap.destroy();
    this.game.globals.plugins.lighting.removeLight(this);
  }

  _redrawLight() {
    // Draw the circular gradient for the light. This is the light without factoring in shadows
    this._bitmap.cls();
    this._bitmap.blendSourceOver(); // Default blend mode
    this._bitmap.draw(this._sprite);
  }

  _redrawShadow(points) {
    // Destination in blend mode - the next thing drawn acts as a mask for the existing canvas
    // content
    this._bitmap.blendDestinationIn();

    // Draw the "light rays"
    this._bitmap.ctx.beginPath();
    this._bitmap.ctx.fillStyle = "white";
    this._bitmap.ctx.strokeStyle = "white";

    // Figure out the offset needed to convert the world positions of the light points to local
    // coordinates within the bitmap
    const off = this.getTopLeft();
    this._bitmap.ctx.moveTo(points[0].x - off.x, points[0].y - off.y);
    for (const p of points) {
      this._bitmap.ctx.lineTo(p.x - off.x, p.y - off.y);
    }
    this._bitmap.ctx.closePath();
    this._bitmap.ctx.fill();
  }

  _updateDebug() {
    // The debug canvas is draw at the light's current position, so all debug shapes drawn need to
    // be drawn at (0, 0) to match the light
    this._debugGraphics.position.copyFrom(this.position);
    this._debugGraphics.clear();
    this._debugGraphics.lineStyle(5, 0xff00ff, 0.6);
    this._debugGraphics.drawCircle(0, 0, 2);
    if (this.shape instanceof Phaser.Circle) {
      this._debugGraphics.drawCircle(0, 0, 2 * this.shape.radius);
    } else if (this.shape instanceof Phaser.Polygon) {
      const points = this._points.slice(0);
      points.push(points[0]);
      this._debugGraphics.drawPolygon(points);
    }
  }

  _recalculateWalls() {
    const walls = this.game.globals.plugins.lighting.getWalls();

    // Determine which walls have normals that face away from the light - these are the walls that
    // intersect light rights
    const intersectingWalls = [];
    for (let w = 0; w < walls.length; w++) {
      const wall = walls[w];

      // Ignore walls that are not within range of the light. MH: this is essentially checking
      // whether two circles intersect. Circle 1 is the the light. Circle 2 is a circle that
      // circumscribes the wall (e.g. placed at the midpoint, with a radius of half wall
      // length). There are more accurate circle vs line collision detection algorithms that
      // we could use if needed...
      const dist = wall.midpoint.distance(this.position);
      if (dist > this._boundingRadius + wall.length / 2) continue;

      // Shift the light so that its origin is at the wall midpoint, then calculate the dot of
      // the that and the normal. This way both vectors have the same origin point.
      const relativePos = Phaser.Point.subtract(this.position, wall.midpoint);
      const dot = wall.normal.dot(relativePos);
      const isBackFacing = dot < 0;

      // Add some information to the wall to indicate whether it is back facing or not. Walls
      // are passed around by reference, so each light does not have its own unique copy.
      // Thus, the information needs to be stored under an id unique to the specific light.
      wall.backFacings = wall.backFacings || {};
      wall.backFacings[this.id] = isBackFacing;

      intersectingWalls.push(wall);
    }

    return intersectingWalls;
  }

  /**
   * Rotates the light if the shape is a polygon
   *
   * @param {number} angle Angle in radians
   *
   * @memberof Light
   */
  _setRotation(angle) {
    this.rotation = angle;
    if (!(this.shape instanceof Phaser.Polygon)) return;
    this._points = [];
    for (let i = 0; i < this._originalPoints.length; i++) {
      const newPoint = this._originalPoints[i].clone().rotate(0, 0, angle);
      this._points.push(newPoint);
    }
    this.shape = new Phaser.Polygon(this._points);
  }
}
