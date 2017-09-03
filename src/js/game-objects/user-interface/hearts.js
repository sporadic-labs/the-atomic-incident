class Hearts extends Phaser.Group {
  /**
     * Creates an instance of Hearts.
     * @param {Phaser.Game} game 
     * @param {number} x 
     * @param {number} y 
     * @param {Phaser.Group} parentGroup 
     * 
     * @memberOf Hearts
     */
  constructor(game, x, y, parentGroup) {
    super(game, parentGroup, "hearts");
    this.position.set(x, y);
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

  update(...args) {
    var numHearts = this._player.hearts;
    for (var i = 0; i < this._hearts.length; i++) {
      if (i < numHearts) this._hearts[i].frameName = this._fullHeartName;
      else this._hearts[i].frameName = this._emptyHeartName;
    }
    super.update(...args);
  }
}

module.exports = Hearts;
