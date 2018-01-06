const DISABLED_FREQUENCY = 5000;

export default class AudioProcessor {
  /**
   * Creates an instance of AudioProcessor.
   * @param {Phaser.Game} game 
   * 
   * @memberOf AudioProcessor
   */
  constructor(game) {
    this.game = game;

    this.soundManager = game.sound;
    this.context = game.sound.context;
    this.masterGainNode = game.sound.masterGain;
    this.isLowPassConnected = false;

    this.timer = this.game.time.create(false);
    this.timer.start();

    this.lowPassNode = new BiquadFilterNode(this.context, {
      type: "lowpass",
      Q: 1,
      frequency: DISABLED_FREQUENCY
    });
  }

  /**
   * Fade the low pass filter effect in quickly, hold for the specified duration and then fade the
   * filter out quickly.
   * 
   * @param {number} [duration=2000] Duration in milliseconds
   * @memberof AudioProcessor
   */
  runLowPassFilter(duration = 2000) {
    this.timer.removeAll();
    this.fadeInLowPassFilter();
    this.timer.add(duration, () => this.fadeOutLowPassFilter());
  }

  /**
   * Fade in the low pass filter effect using an exponential tween. For more information on the
   * timeConstant, see: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime.
   * Connects the filter to the audio context if it is not currently connected.
   * 
   * @param {number} [timeConstant=0.1] Time constant of exponential curve in seconds
   * @param {number} [targetFrequency=350] 
   * @memberof AudioProcessor
   */
  fadeInLowPassFilter(timeConstant = 0.1, targetFrequency = 150) {
    this.timer.removeAll();
    if (!this.isLowPassConnected) this.connectLowPassFilter();
    const now = this.now();
    this.lowPassNode.frequency.cancelScheduledValues(now);
    this.lowPassNode.frequency.setValueAtTime(now, DISABLED_FREQUENCY);
    this.lowPassNode.frequency.setTargetAtTime(targetFrequency, now, timeConstant);
  }

  /**
   * Fade out the low pass filter effect using an exponential tween. For more information on the
   * timeConstant, see: https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime.
   * Disconnects the filter from the audio context after the fade is mostly done.
   * 
   * @param {number} [timeConstant=0.1] Time constant of exponential curve in seconds
   * @param {number} [targetFrequency=DISABLED_FREQUENCY] 
   * @memberof AudioProcessor
   */
  fadeOutLowPassFilter(timeConstant = 0.1, targetFrequency = DISABLED_FREQUENCY) {
    this.timer.removeAll();
    const now = this.now();
    this.lowPassNode.frequency.cancelScheduledValues(now);
    this.lowPassNode.frequency.setTargetAtTime(targetFrequency, now, timeConstant);
    // Remove when close enough (95%) to target, see:
    //  https://developer.mozilla.org/en-US/docs/Web/API/AudioParam/setTargetAtTime
    this.timer.add(3000 * timeConstant, () => this.disconnectLowPassFilter());
  }

  now() {
    return this.context.currentTime;
  }

  connectLowPassFilter() {
    this.masterGainNode.disconnect(this.context.destination);
    this.masterGainNode.connect(this.lowPassNode);
    this.lowPassNode.connect(this.context.destination);
    this.isLowPassConnected = true;
  }

  disconnectLowPassFilter() {
    this.lowPassNode.disconnect(this.context.destination);
    this.masterGainNode.disconnect(this.lowPassNode);
    this.masterGainNode.connect(this.context.destination);
    this.isLowPassConnected = false;
  }

  /**
   * @memberOf AudioProcessor
   */
  destroy() {
    this.timer.destroy();
  }
}
