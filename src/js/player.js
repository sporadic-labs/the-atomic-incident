// player module

define('player', ['phaser'], function (Phaser) {
	
  console.log('Function : Player');

  // constructor
  function Player() {
  }

  Player.prototype = {
  	// setup player
  	init: function() {
			this.player = this.add.sprite(this.world.width/2, this.world.height/2, 'player');
			// enable physics on player
			this.physics.arcade.enable(this.player);
			// physics properties
			this.player.body.collideWorldBounds = true;
		  this.player.body.setSize(36, 36);

	 	},
  	// check for keyboard input and update player position
  	updatePos: function() {
			// reset players velocity each frame
			this.player.body.velocity.x = 0;
			this.player.body.velocity.y = 0;

			// check for key input, update player position
			// vertical movement
			if (this.keys.left.isDown || this.leftAlt.isDown) {
				// move left
				this.player.body.velocity.x = -150;
				// if the player is in the center of the screen, scroll the grid
				if (this.player.worldPosition.x >= 298 && this.player.worldPosition.x <= 302) {
					// scroll grid
		    	this.grid.tilePosition.x += 2;
				}
			} else if (this.keys.right.isDown || this.rightAlt.isDown) {
				// move right
				this.player.body.velocity.x = 150;
				// if the player is in the center of the screen, scroll the grid
				if (this.player.worldPosition.x >= 298 && this.player.worldPosition.x <= 302) {
					// scroll grid
		    	this.grid.tilePosition.x -= 2;
				}
			}
			// horizontal movement
			if (this.keys.up.isDown || this.upAlt.isDown) {
				// move up
				this.player.body.velocity.y = -150;
				// if the player is in the center of the screen, scroll the grid
				if (this.player.worldPosition.y >= 298 && this.player.worldPosition.y <= 302) {
					// scroll grid
		    	this.grid.tilePosition.y += 2;
				}
			} else if (this.keys.down.isDown || this.downAlt.isDown) {
				// move down
				this.player.body.velocity.y = 150;
				// if the player is in the center of the screen, scroll the grid
				if (this.player.worldPosition.y >= 298 && this.player.worldPosition.y <= 302) {
					// scroll grid
		    	this.grid.tilePosition.y -= 2;
				}
			}
  	}
  };

  // return module to give access to constructor and methods
  return Player;

});