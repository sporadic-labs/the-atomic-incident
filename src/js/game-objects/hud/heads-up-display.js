import Radar from "./radar";
import { autorun } from "mobx";
import { gameStore } from "../../game-data/observable-stores";
import MENU_STATES from "../../menu/menu-states";

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

    this.radar = new Radar(game);

    const playPos = new Phaser.Point(game.width - 10, game.height - 10);
    const pauseButton = game.add.button(
      playPos.x,
      playPos.y,
      "assets",
      () => {
        gameStore.setMenuState(MENU_STATES.PAUSE);
        gameStore.pause();
      },
      this,
      "hud/pause",
      "hud/pause",
      "hud/pause",
      "hud/pause"
    );
    pauseButton.anchor.set(1, 1);
    const playButton = game.add.button(
      playPos.x,
      playPos.y,
      "assets",
      () => {
        gameStore.setMenuState(MENU_STATES.NONE);
        gameStore.unpause();
      },
      this,
      "hud/play",
      "hud/play",
      "hud/play",
      "hud/play"
    );
    playButton.anchor.set(1, 1);
    playButton.visible = false;

    // Observe the game data's pause/unpause
    autorun(() => {
      if (gameStore.isPaused) {
        game.paused = true;
        pauseButton.visible = false;
        playButton.visible = true;
      } else {
        game.paused = false;
        pauseButton.visible = true;
        playButton.visible = false;
      }
    });

    // Text for HUD
    // this._scoreText = game.make.text(this.game.width / 2, 34, "", {
    //     font: "30px 'Alfa Slab One'", fill: "#ffd800", align: "center"
    // });
    // this._scoreText.anchor.setTo(0.5);
    // this.add(this._scoreText);

    this._ammoText = game.make.text(15, 10, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "center"
    });
    this.add(this._ammoText);

    this._debugText = game.make.text(15, game.height - 5, "Debug ('E' key)", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C",
      align: "left"
    });
    this._debugText.anchor.set(0, 1);
    this.add(this._debugText);

    this._fpsText = game.make.text(15, game.height - 25, "60", {
      font: "18px 'Alfa Slab One'",
      fill: "#9C9C9C",
      align: "left"
    });
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
      this._ammoText.setText(
        this._player.weapon.getAmmo() + " / " + this._player.weapon._totalAmmo
      );
    } else {
      this._ammoText.setText("Reloading...");
    }

    this._fpsText.setText(this.game.time.fps);

    // Update Enemy Trackers
    this.radar.update();
  }
}

module.exports = HeadsUpDisplay;
