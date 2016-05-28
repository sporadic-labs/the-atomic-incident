/**
 * StartScreen - start here!
 */

module.exports = StartScreen;

function StartScreen() {}

StartScreen.prototype.init = function () {    
    this.titleText = this.add.text(this.world.centerX, this.world.centerY, 
        "Octo-Chainsaw", { 
            font: "60px Arial", 
            fill: "#000", 
            align: "center" 
        });
    this.titleText.anchor.set(0.5);
    this.titleText.setShadow(3, 3, 'rgba(0,0,0,0.5)', 5);
    this.titleText.anchor.set(0.5);
};


StartScreen.prototype.create = function () {
    // this.stage.disableVisibilityChange = true;
    // this.add.sprite(0, 0, 'menu-bg');
    // this.add.existing(this.titleText);

    var gameTitle = this.game.add.sprite(160,160,"gametitle");
    gameTitle.anchor.setTo(0.5,0.5);
    var playButton = this.game.add.button(160,320,"play",this.playTheGame,this);
    playButton.anchor.setTo(0.5,0.5);

};

StartScreen.prototype.playTheGame = function () {
    this.game.state.start("TheGame");
};


    // create: function(){
    //     var gameTitle = this.game.add.sprite(160,160,"gametitle");
    //     gameTitle.anchor.setTo(0.5,0.5);
    //     var playButton = this.game.add.button(160,320,"play",this.playTheGame,this);
    //     playButton.anchor.setTo(0.5,0.5);
    // },
    // playTheGame: function(){
    //     this.game.state.start("TheGame");
    // }
