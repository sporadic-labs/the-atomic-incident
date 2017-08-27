import PauseMenu from "./user-interface/pause-menu";

/**
 * Player Heads Up Display.
 * Advanced HUD made with bleeding edge nano tech and the most advanced
 * x-ray, sonar, infrared and [REDACTED] for unmatched exploration.
 * Keeps track of Pause/Mute, Score, Ammo, and FPS (debug only!).
 * 
 * @class HeadsUpDisplay
 * @extends {Phaser.Group}
 */
class HeadsUpDisplay extends Phaser.Group {

    /**
     * @param {Phaser.Game} game
     * @param {Phaser.Group} parentGroup
     */
    constructor(game, parentGroup) {
        super(game, parentGroup, "heads-up-display");

        this.game = game;
        this._scoreKeeper = this.game.globals.scoreKeeper;
        this._player = this.game.globals.player;
        this._satBodyPlugin = this.game.globals.plugins.satBody;
        this.fixedToCamera = true;
    
        this.registeredEnemies = [];
        this.enemyTrackers = [];
    
        // Play/pause
        const unpause = () => {
            pauseButton.visible = true;
            playButton.visible = false;
        }
        const playPos = new Phaser.Point(game.width - 10, game.height - 10);
        const pauseButton = game.add.button(playPos.x, playPos.y, "assets", () => {
            playButton.visible = true;
            pauseButton.visible = false;
            new PauseMenu(game);
            game.globals.onUnPause.add(unpause);
            game.globals.onPause.dispatch();
        }, this, "hud/pause", "hud/pause", "hud/pause", "hud/pause");
        pauseButton.anchor.set(1, 1);
        const playButton = game.add.button(playPos.x, playPos.y, "assets", unpause, this,
            "hud/play", "hud/play", "hud/play", "hud/play");
        playButton.anchor.set(1, 1);
        playButton.visible = false;
    
        // Mute/unmute
        const mutePos = new Phaser.Point(game.width - 10, 10);
        const muteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
            unmuteButton.visible = true;
            muteButton.visible = false;
            game.sound.mute = true;
        }, this, "hud/sound", "hud/sound", "hud/sound", "hud/sound");
        muteButton.anchor.set(1, 0);
        const unmuteButton = game.add.button(mutePos.x, mutePos.y, "assets", () => {
            unmuteButton.visible = false;
            muteButton.visible = true;
            game.sound.mute = false;
        }, this, "hud/mute", "hud/mute", "hud/mute", "hud/mute");
        unmuteButton.anchor.set(1, 0);
        // Show the appropriate button based on sound manager's state
        if (game.sound.mute) muteButton.visible = false;
        else unmuteButton.visible = false;
    
        // Text for HUD
        // this._scoreText = game.make.text(this.game.width / 2, 34, "", {
        //     font: "30px 'Alfa Slab One'", fill: "#ffd800", align: "center"
        // });
        // this._scoreText.anchor.setTo(0.5);
        // this.add(this._scoreText);
    
        this._ammoText = game.make.text(15, 10, "", {
            font: "24px 'Alfa Slab One'", fill: "#ffd800", align: "center"
        });
        this.add(this._ammoText);
    
        this._debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
            font: "18px 'Alfa Slab One'", fill: "#9C9C9C", align: "left"
        });
        this._debugText.anchor.set(0, 1);
        this.add(this._debugText);
    
        this._fpsText = game.make.text(15, game.height - 25, "60", {
            font: "18px 'Alfa Slab One'", fill: "#9C9C9C", align: "left"
        })
        this._fpsText.anchor.set(0, 1);
        this.add(this._fpsText);
    }

    /**
     * 
     * 
     * @memberof HeadsUpDisplay
     */
    update() {
        // this._scoreText.setText(this.game.globals.scoreKeeper.getScore());
        super.update(arguments);
    
        if (!this._player.weapon._isReloading) {
            this._ammoText.setText(this._player.weapon.getAmmo() + " / " +
                this._player.weapon._totalAmmo);
        } else {
            this._ammoText.setText("Reloading...");
        }
    
        this._fpsText.setText(this.game.time.fps);

        // Update Enemy Trackers
        for (let enemy of this.registeredEnemies) {
            this._updateEnemyTrackerPosition(enemy);
        }
    }

    /**
     * When a new Enemy is created, register it with the HUD, and an Enemy Tracker will be created.
     * 
     * @param {any} enemy 
     * @memberof HeadsUpDisplay
     */
    registerEnemy(enemy) {
        this.registeredEnemies.push(enemy);
        this._addEnemyTracker(enemy);
    }

    /**
     * When an Enemy dies, remove it from the Registry and remove the Enemy Tracker.
     * 
     * @param {any} enemy 
     * @memberof HeadsUpDisplay
     */
    removeEnemy(enemy) {
        this.registeredEnemies.filter((e) => {
            return e !== enemy;
        });
        this._removeEnemyTracker(enemy);
    }

    /**
     * Add a Tracker entry to the list of EnemyTrackers, and create the HUD image.
     * 
     * @param {any} enemy 
     * @memberof HeadsUpDisplay
     */
    _addEnemyTracker(enemy) {
        // Shorthand.
        const player = this.game.globals.player;

        // Calculate initial position of the Enemy Tracker.
        var { x: x, x: y } = this._getTrackerPosition(enemy);
        // Create the Arrow Image for the Enemy Tracker.
        const arrowImg = this.game.make.image(x, y, "assets", "hud/targeting-arrow");
        arrowImg.anchor.copyFrom(player.anchor);
        const scale = 0.86;
        arrowImg.scale.setTo(scale, scale);
        // TODO(rex): Change the color of the arrow.
        // arrowImg.tint(Color.white);
        
        // Add the Arrow Image to the HUD group.
        this.add(arrowImg);

        // And add a Tracking entry, which will be useful for updating the position.
        this.enemyTrackers.push({
            "enemy": enemy,
            "image": arrowImg,
        });
    }

    /**
     * Remove a Tracker from the HUD, and remove it's entry form the list of EnemyTrackers.
     * 
     * @param {any} enemy 
     * @memberof HeadsUpDisplay
     */
    _removeEnemyTracker(enemy) {
        // Find the Tracker entry associated with this enemy.
        const eT = this.enemyTrackers.find((e) => {
            return e.enemy === enemy;
        });

        // Remove the Image from the Phaser Group.
        this.remove(eT);

        // Destroy the Tracker arrow image.
        eT.image.destroy();

        // Then remove the Tracker from the list.
        this.enemyTrackers.filter((e) => {
            return e.enemy === enemy;
        });
    }

    /**
     * Update the position of the Tracker Image based on the position of the
     * enemy, player, and light.
     * 
     * @param {any} enemy 
     * @memberof HeadsUpDisplay
     */
    _updateEnemyTrackerPosition(enemy) {
        //Shorthand
        const player = this.game.globals.player;

        // Get the Tracking Entry for the requested enemy.
        const entry = this.enemyTrackers.find((e) => {
            return e.enemy === enemy;
        });
                
        // Position
        var { x: cX, y: cY } = this._getTrackerPosition(enemy);
        entry.image.position.copyFrom(new Phaser.Point(cX, cY));
        
        // Rotation
        const angle = player.position.angle(enemy.position);
        entry.image.rotation = angle + (Math.PI/2);
    }

    /**
     * Calculate the position of the Arrow Image based on the player
     * position and the enemy position.
     * 
     * @param {any} entry 
     * @returns { x : int, y: int }
     * @memberof HeadsUpDisplay
     */
    _getTrackerPosition(enemy) {
        // Shorthand.
        const player = this.game.globals.player;

        // The tracker should be placed around the radius of the light,
        // between the enemy and the player.
        const angle = player.position.angle(enemy.position);
        const radiusModifier = 0.9;
        var x = player.position.x + (radiusModifier * player._playerLight.getRadius()) *
            Math.cos(angle);
        var y = player.position.y + (radiusModifier * player._playerLight.getRadius()) *
            Math.sin(angle);

        return { x, y };
    }

}

module.exports = HeadsUpDisplay;
