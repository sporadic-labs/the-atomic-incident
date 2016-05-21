module.exports = Player;

// Prototype chain - inherits from Sprite
Player.prototype = Object.create(Phaser.Sprite.prototype);
Player.prototype.constructor = Player; // Make sure constructor reads properly

function Player(game, x, y, parentGroup) {
    // Call the sprite constructor, but instead of it creating a new object, it
    // modifies the current "this" object
    Phaser.Sprite.call(this, game, x, y, "assets", "player");
    
    // Add to parentGroup, if it is defined
    if (parentGroup) parentGroup.add(this);
    else game.add.existing(this);

    game.physics.arcade.enable(this);
    this.body.collideWorldBounds = true;
    this.body.setSize(36, 36);

    // Player controls
    this.keys = this.game.input.keyboard.createCursorKeys();
    this.upAlt = this.game.input.keyboard.addKey(Phaser.Keyboard.W);
    this.downAlt = this.game.input.keyboard.addKey(Phaser.Keyboard.S);
    this.rightAlt = this.game.input.keyboard.addKey(Phaser.Keyboard.D);
    this.leftAlt = this.game.input.keyboard.addKey(Phaser.Keyboard.A);
}

Player.prototype.update = function () {

    // Calculate the player heading
    var heading = new Phaser.Point(0, 0);
    if (this.keys.left.isDown || this.leftAlt.isDown) heading.x = -1;
    else if (this.keys.right.isDown || this.rightAlt.isDown) heading.x = 1;
    if (this.keys.up.isDown || this.upAlt.isDown) heading.y = -1;
    else if (this.keys.down.isDown || this.downAlt.isDown) heading.y = 1;

    // Normalize the heading and set the magnitude. This makes it so that the
    // player moves in the same speed in all directions (even diagonals).
    heading = heading.setMagnitude(250);

    // Reset velocity to zero
    this.body.velocity.copyFrom(heading);
};

//     // check for keyboard input and update player position
//     updatePos: function() {
//             // reset players velocity each frame
//             this.player.body.velocity.x = 0;
//             this.player.body.velocity.y = 0;

//             // check for key input, update player position
//             // vertical movement
//             if (this.keys.left.isDown || this.leftAlt.isDown) {
//                 // move left
//                 this.player.body.velocity.x = -150;
//                 // if the player is in the center of the screen, scroll the grid
//                 if (this.player.worldPosition.x >= 298 && this.player.worldPosition.x <= 302) {
//                     // scroll grid
//                 this.grid.tilePosition.x += 2;
//                 }
//             } else if (this.keys.right.isDown || this.rightAlt.isDown) {
//                 // move right
//                 this.player.body.velocity.x = 150;
//                 // if the player is in the center of the screen, scroll the grid
//                 if (this.player.worldPosition.x >= 298 && this.player.worldPosition.x <= 302) {
//                     // scroll grid
//                 this.grid.tilePosition.x -= 2;
//                 }
//             }
//             // horizontal movement
//             if (this.keys.up.isDown || this.upAlt.isDown) {
//                 // move up
//                 this.player.body.velocity.y = -150;
//                 // if the player is in the center of the screen, scroll the grid
//                 if (this.player.worldPosition.y >= 298 && this.player.worldPosition.y <= 302) {
//                     // scroll grid
//                 this.grid.tilePosition.y += 2;
//                 }
//             } else if (this.keys.down.isDown || this.downAlt.isDown) {
//                 // move down
//                 this.player.body.velocity.y = 150;
//                 // if the player is in the center of the screen, scroll the grid
//                 if (this.player.worldPosition.y >= 298 && this.player.worldPosition.y <= 302) {
//                     // scroll grid
//                 this.grid.tilePosition.y -= 2;
//                 }
//             }
//     }
//   };

//   // return module to give access to constructor and methods
//   return Player;

// });