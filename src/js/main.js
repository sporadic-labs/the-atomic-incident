// main.js

// create new Phaser Game object, attach the octoChainsaw function as a state
var theGame = new Phaser.Game(600, 600, Phaser.AUTO, 'the-game-area');
theGame.state.add('Game', octoChainsaw, true);

// constructor function for our game
function octoChainsaw() {
	// background
	this.grid = null;
	// pickups
	this.boxGroup = null;
	this.diamondGroup = null;
	//player
	this.player = null;
	this.arrow = null;
	this.reticule = null;
	this.bullet = null;
	// score
	this.score = 0;
	this.scoreText = null;
	// controls
	this.keys = null;
	this.upAlt = null;
	this.downAlt = null;
	this.rightAlt = null;
	this.leftAlt = null;
	this.mouse = null;
};

octoChainsaw.prototype.init = function() {
	// resize world to be larger than the canvas
	this.world.resize(2000, 2000);
	// arcade physics
	this.physics.startSystem(Phaser.Physics.ARCADE);
  this.physics.arcade.gravity.y = 0;
  this.physics.arcade.gravity.x = 0;
};

octoChainsaw.prototype.preload = function() {
	// load sprites
	this.load.image('grid', 'img/grid.png');
	this.load.image('box', 'img/box.png');
	this.load.image('diamond', 'img/diamond.png');
	this.load.image('player', 'img/player.png');
	this.load.image('arrow', 'img/arrow.png');
	this.load.image('reticule', 'img/player.png');
};

octoChainsaw.prototype.create = function() {
	// background
  this.stage.backgroundColor = '#F9F9F9';
  this.grid = this.add.tileSprite(0, 0, 600, 600, 'grid');
  this.grid.fixedToCamera = true;

	// player
	this.player = this.add.sprite(this.world.width/2, this.world.height/2, 'player');
	// enable physics on player
	this.physics.arcade.enable(this.player);
	// physics properties
	this.player.body.collideWorldBounds = true;
  this.player.body.setSize(36, 36);

  this.camera.follow(this.player);


  // targeting
	this.arrow = this.add.sprite(this.player.position.x, this.player.position.y, 'arrow');
	this.reticule = this.add.sprite(this.input.mousePointer.x, this.input.mousePointer.y, 'reticule');
	// this.reticule = this.add.sprite(this.world.width/3, this.world.height/3, 'reticule');


	// setup this.keys using Phasers createCursorKeys function
	this.keys = this.input.keyboard.createCursorKeys();
	this.upAlt = this.input.keyboard.addKey(Phaser.Keyboard.W);
	this.downAlt = this.input.keyboard.addKey(Phaser.Keyboard.S);
	this.rightAlt = this.input.keyboard.addKey(Phaser.Keyboard.D);
	this.leftAlt = this.input.keyboard.addKey(Phaser.Keyboard.A);

	// setup pickup groups, add physics to each one
	this.boxGroup = this.add.group();
	this.boxGroup.enableBody = true;
	// create 12 boxs and give random position
	for (var i=0; i<100; i++) {
		var box = this.boxGroup.create(i*20, (Math.random()*1900)+50, 'box');
	}
	this.diamondGroup = this.add.group();
	this.diamondGroup.enableBody = true;
	// create 12 diamonds and give random position
	for (var i=0; i<100; i++) {
		var diamond = this.diamondGroup.create(i*20, (Math.random()*1900)+50, 'diamond');
	}

	// set initial this.score to 0, setup score text
	this.score = 0;
	this.scoreText = this.add.text(16, 16, 'Score: 0', {fontSize: '32px', fill: '#000'});
  this.scoreText.fixedToCamera = true;
};

octoChainsaw.prototype.update = function() {
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

	// update targeting system
	this.arrow.position.x = this.player.position.x;
	this.arrow.position.y = this.player.position.y;
	this.reticule.position.x = this.input.mousePointer.x;
	this.reticule.position.y = this.input.mousePointer.y;

	// check for collisions between player and pickups
	this.physics.arcade.overlap(this.player, this.boxGroup, this.collectItem, null, this);
	this.physics.arcade.overlap(this.player, this.diamondGroup, this.collectItem, null, this);
};

octoChainsaw.prototype.collectItem = function(player, collectable) {
	// remove collectable from screen
	collectable.kill();
	// increase score
	this.score++;
	this.scoreText.text = 'Score: ' + this.score;
};