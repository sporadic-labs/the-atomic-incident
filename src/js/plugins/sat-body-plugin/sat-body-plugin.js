var SatBody = require("./sat-body.js");

module.exports = Phaser.Plugin.SatBody = function (game, parent) {
    this.game = game;
    this.parent = parent;
    this._bodies = [];
    this._isDebug = false;
};

Phaser.Plugin.SatBody.prototype = Object.create(Phaser.Plugin.prototype);

Phaser.Plugin.SatBody.prototype.addBoxBody = function (sprite, width, height) {
    var body = new SatBody(sprite);
    body.initBox(width, height);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.addCircleBody = function (sprite, radius) {
    var body = new SatBody(sprite);
    body.initCircle(radius);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.addPolygonBody = function (sprite, points) {
    var body = new SatBody(sprite);
    body.initPolygon(points);
    if (this._isDebug) body.enableDebug();
    this._bodies.push(body);
    return body;
};

Phaser.Plugin.SatBody.prototype.isDebugAllEnabled = function () {
    return (this._isDebug === true);
};

Phaser.Plugin.SatBody.prototype.enableDebugAll = function () {
    this._isDebug = true;
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].enableDebug();
    }
};

Phaser.Plugin.SatBody.prototype.disableDebugAll = function () {
    this._isDebug = false;
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].disableDebug();
    }
};

Phaser.Plugin.SatBody.prototype.postUpdate = function () {
    // Update after the physics have been applied to all game objects
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].postUpdate();
    }
};

Phaser.Plugin.SatBody.prototype.removeBody = function (body) {
    for (var i = 0; i < this._bodies.length; i += 1) {
        if (body === this._bodies[i]) {
            this._bodies.splice(i, 1);
            break;
        }
    }
};

Phaser.Plugin.SatBody.prototype.destroy = function () {
    for (var i = 0; i < this._bodies.length; i += 1) {
        this._bodies[i].destroy();
    }
};
