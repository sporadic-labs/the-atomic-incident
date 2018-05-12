import LifeCycleObject from "../lifecycle-object";

const ANIM = {
  HIT: "PLAYER_HIT",
  MOVE: "PLAYER_MOVE",
  DIE: "PLAYER_DIE"
};

export default class Player extends LifeCycleObject {
  constructor(scene, x, y) {
    super(scene);

    this.sprite = scene.add.sprite(x, y, "assets", "player/move");

    scene.anims.create({
      key: ANIM.HIT,
      frames: scene.anims.generateFrameNames("assets", {
        prefix: "player/hit-flash_",
        end: 32,
        zeroPad: 2
      }),
      frameRate: 30
    });
    scene.anims.create({ key: ANIM.MOVE, frames: "player/move", repeat: -1 });
    scene.anims.create({
      key: ANIM.DIE,
      frames: scene.anims.generateFrameNames("assets", {
        prefix: "player/death_",
        end: 15,
        zeroPad: 2
      }),
      frameRate: 30
    });

    // Just for the moment, set the animations to cycle to verify settings
    this.sprite.play(ANIM.HIT);
    this.sprite.on("animationcomplete", currentAnim => {
      const transitions = {
        [ANIM.HIT]: ANIM.DIE,
        [ANIM.DIE]: ANIM.HIT
      };
      this.sprite.play(transitions[currentAnim.key]);
    });
  }

  update(time, delta) {}

  destroy() {
    this.sprite.destroy();
    super.destroy();
  }
}
