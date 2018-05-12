/** WASD/Arrow key controls */
export default class MoveControls {
  /**
   * Creates an instance of MoveControls.
   * @param {Phaser.Input.Keyboard} keyboard
   * @memberof MoveControls
   */
  constructor(keyboard) {
    const { LEFT, RIGHT, UP, DOWN, W, S, A, D } = Phaser.Input.Keyboard.KeyCodes;
    this.keys = keyboard.addKeys({
      left: LEFT,
      right: RIGHT,
      up: UP,
      down: DOWN,
      w: W,
      s: S,
      a: A,
      d: D
    });
  }

  /**
   * Get the current value of the x-axis of the move controls
   * @returns A number between -1 (left) and 1 (right)
   * @memberof MoveControls
   */
  getXAxis() {
    return (
      (this.keys.left.isDown || this.keys.a.isDown ? -1 : 0) +
      (this.keys.right.isDown || this.keys.d.isDown ? 1 : 0)
    );
  }

  /**
   * Get the current value of the y-axis of the move controls
   * @returns A number between -1 (left) and 1 (right)
   * @memberof MoveControls
   */
  getYAxis() {
    return (
      (this.keys.up.isDown || this.keys.w.isDown ? -1 : 0) +
      (this.keys.down.isDown || this.keys.s.isDown ? 1 : 0)
    );
  }
}
