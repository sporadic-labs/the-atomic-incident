/** Class representing an object capable of being updated with a Scene's lifecycle hooks */
export default class LifecycleObject {
  constructor(scene) {
    this.scene = scene;

    if (this.preUpdate) scene.events.on("preupdate", this.preUpdate, this);
    if (this.update) scene.events.on("update", this.update, this);
    if (this.postUpdate) scene.events.on("postupdate", this.postUpdate, this);

    // If needed, this could also be extended to listen for other scene events: render, pause,
    // resume, sleep, wake
  }

  destroy() {
    if (this.preUpdate) this.scene.events.off("preupdate", this.preUpdate, this);
    if (this.update) this.scene.events.off("update", this.update, this);
    if (this.postUpdate) this.scene.events.off("postupdate", this.postUpdate, this);
  }
}
