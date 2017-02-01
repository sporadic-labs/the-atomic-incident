module.exports = HeadsUpDisplay;

HeadsUpDisplay.prototype = Object.create(Phaser.Group.prototype);

function HeadsUpDisplay(game, parentGroup) {
    Phaser.Group.call(this, game, parentGroup, "heads-up-display");
    
    this.game = game;
    this._scoreKeeper = this.game.globals.scoreKeeper;
    this._player = this.game.globals.player;
    this._satBodyPlugin = this.game.globals.plugins.satBody;
    this._options = this.game.globals.options;

    this.fixedToCamera = true;

    var textStyle = {
        font: "32px Arial",
        fill: "#9C9C9C",
        align: "left"
    };
    this._heartsText = game.make.text(30, 20, "Hearts: 3", textStyle);
    this.add(this._heartsText);
    this._coinsText = game.make.text(30, 60, "Coins: 0", textStyle);
    this.add(this._coinsText);
    this._towerText = game.make.text(30, 100, "Tower: Pulse", textStyle);
    this.add(this._towerText);
    this._debugText = game.make.text(30, game.height - 45, 
        "Debug ('E' key): false", textStyle);
    this._debugText.fontSize = 14;
    this.add(this._debugText);
    this._controlText = game.make.text(30, game.height - 25, 
        "Control ('C' key): mouse", textStyle);
    this._controlText.fontSize = 14;
    this.add(this._controlText);
}

HeadsUpDisplay.prototype.update = function () {
    this._coinsText.setText("Coins: " + this._player.coins);
    this._heartsText.setText("Hearts: " + this._player.hearts);
    var towerText = this.game.globals.towerList[this.game.globals.towerToPlace];
    if (!towerText) towerText = "none";
    this._towerText.setText("Tower: " + towerText);

    this._debugText.setText("Debug ('E' key): " + 
        this._satBodyPlugin.isDebugAllEnabled());

    this._controlText.setText("Control ('C' key): " + 
        this._options.controlTypes[this._options.controls]);
};