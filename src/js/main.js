// main.js


(function () {
  'use strict';

	// config require.js to find correct paths
	// and load dependencies in the correct order
    requirejs.config({
    	// base url for dependecy location
      // baseUrl: "src/",
      
      paths: {
        phaser: '../lib/phaser.min'
      },

      shim: {
        'phaser': {
          exports: 'Phaser'
        }
      }
    });
 
    require(['phaser', 'gameManager'], function (Phaser, GameManager) {
      var game = new GameManager();
      game.start();
    });
}());