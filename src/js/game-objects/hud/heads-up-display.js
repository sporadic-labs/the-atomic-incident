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
export default class HeadsUpDisplay extends Phaser.Group {
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

    // HUD animation variables.
    this._comboAnimationStartTime = 0;
    this._comboAnimationDuration = 0;
    this._playComboAnimation = false;
    this._reloadAnimationStartTime = 0;
    this._reloadAnimationDuration = 0;
    this._playReloadAnimation = false;

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
    // Score
    this._scoreText = game.make.text(this.game.width / 2, 32, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "center"
    });
    this._scoreText.anchor.setTo(0.5);
    this.add(this._scoreText);
    // Combo
    this._comboModifierText = game.make.text(this.game.width - 84, 10, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "center"
    });
    this.add(this._comboModifierText);
    this._comboModifierMask = game.make.text(this.game.width - 84, 10, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#a59640",
      align: "center"
    });
    this.add(this._comboModifierMask);
    // Combo modifier mask is hidden by default.
    this._comboModifierMask.visible = false;
    this._comboScoreText = game.make.text(this.game.width - 84, 42, "", {
      font: "30px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "center"
    });
    this.add(this._comboScoreText);

    // Ammo
    this._ammoMask = game.make.text(15, 10, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#a59640",
      align: "center"
    });
    this.add(this._ammoMask);
    // NOTE(rex): Mask is hidden to begin with.
    this._ammoMask.visible = false;
    this._ammoText = game.make.text(15, 10, "", {
      font: "24px 'Alfa Slab One'",
      fill: "#ffd800",
      align: "center"
    });
    this.add(this._ammoText);

    // Debug
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
     * Update lifecycle hook.
     * 
     * @memberof HeadsUpDisplay
     */
  update() {
    // this._scoreText.setText(this.game.globals.scoreKeeper.getScore());
    super.update(arguments);

    // Shorthand
    const scoreKeeper = this.game.globals.scoreKeeper;
    const comboTracker = this.game.globals.comboTracker;

    if (!this._player.weapon._isReloading) {
      this._ammoMask.setText(
        this._player.weapon.getAmmo() + " / " + this._player.weapon._totalAmmo
      );
      this._ammoText.setText(
        this._player.weapon.getAmmo() + " / " + this._player.weapon._totalAmmo
      );
    } else {
      this._ammoMask.setText("Reloading...");
      this._ammoText.setText("Reloading...");
    }

    this._fpsText.setText(this.game.time.fps);

    // Update score and combo.
    this._scoreText.setText(scoreKeeper.getScore());
    this._comboModifierText.setText("x" + comboTracker.getComboModifier().toFixed(1));
    this._comboModifierMask.setText("x" + comboTracker.getComboModifier().toFixed(1));
    this._comboScoreText.setText("+" + comboTracker.getComboScore());
    // And play animations if necessary.
    if (this._playReloadAnimation) {
      this._hudReloadAnimation();
    }
    if (this._playComboAnimation) {
      this._hudComboAnimation();
    }

    // Update Enemy Trackers
    this.radar.update();
  }

  /**
   * Start the hud reload animation.
   * 
   * @param {int} duration
   * @memberof HeadsUpDisplay
   */
  startHudReloadAnimation(duration) {
    // Set variables used for the HUD reload animation.
    this._reloadAnimationDuration = duration; // TODO(rex): Default.
    this._reloadAnimationStartTime = Date.now();
    this._playReloadAnimation = true;
    this._ammoMask.visible = true;
  }

  /**
   * Manually updating the mask around the reload text.
   * 
   * @memberof HeadsUpDisplay
   */
  _hudReloadAnimation() {
    // Get the current time, figure our progress through the animation timer,
    // and update the hud accordingly.
    const currentTime = Date.now();
    const diff = currentTime - this._reloadAnimationStartTime;
    if (diff < this._reloadAnimationDuration) {
      // Update the reload mask.
      const fractionMasked = diff / this._reloadAnimationDuration;
      const cropAmount = fractionMasked * this._ammoText.width;
      this._ammoText.crop(new Phaser.Rectangle(0, 0, cropAmount, this._ammoText.height));
    } else {
      // The animation has ended, reset animation variables.
      this._playReloadAnimation = false;
      this._reloadAnimationStartTime = 0;
      this._reloadAnimationDuration = 0; // TODO(rex): This...?
      this._ammoMask.visible = false;
    }
  }

  /**
   * Start the hud combo animation.
   * 
   * @param {any} duration 
   * @memberof HeadsUpDisplay
   */
  startHudComboAnimation(duration) {
    // Set variables used for the HUD combo animation.
    this._comboAnimationDuration = duration; // TODO(rex): Default.
    this._comboAnimationStartTime = Date.now();
    this._playComboAnimation = true;
    this._comboModifierMask.visible = true;
  }

  /**
   * Manually updating the mask around the combo text.
   * 
   * @memberof HeadsUpDisplay
   */
  _hudComboAnimation() {
    // Get the current time, figure our progress through the animation timer,
    // and update the hud accordingly.
    const currentTime = Date.now();
    const diff = currentTime - this._comboAnimationStartTime;
    if (diff < this._comboAnimationDuration) {
      // Update the combo mask.
      const fractionMasked = diff / this._comboAnimationDuration;
      const cropAmount = fractionMasked * this._comboModifierMask.width;
      this._comboModifierMask.crop(
        new Phaser.Rectangle(0, 0, cropAmount, this._comboModifierMask.height)
      );
    } else {
      // The animation has ended, reset animation variables.
      this._playComboAnimation = false;
      this._comboAnimationStartTime = 0;
      this._comboAnimationDuration = 0; // TODO(rex): This...?
      this._comboModifierMask.visible = false;
    }
  }

  /**
   * Destroy lifecycle hook.
   * 
   * @memberof HeadsUpDisplay
   */
  destroy() {
    super.destroy();
  }
}
