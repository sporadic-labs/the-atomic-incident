/** Class representing an object capable of being updated with a Scene's lifecycle hooks */
export default class LifecycleObject {
  constructor(scene) {
    this.scene = scene;

    // EventEmitter3 doesn't allow for listeners to be removed while emit is running. So if one GO
    // destroys another, or one of the Phaser manager systems destroy a GO, there's a potential for
    // an unsubscribed listener to be called.
    // Example: tween manager update happens BEFORE GO's update method since it is earlier in the
    // EventEmitter listeners list. If tween.onComplete destroys the GO and unsubscribes from the
    // event, the GO will still get one last update call. Relevant code:
    //  https://github.com/primus/eventemitter3/blob/master/index.js#L171
    // TODO: Submit PR to EventEmitter
    if (this.preUpdate) scene.events.on("preupdate", this.lifecyclePreUpdate, this);
    if (this.update) scene.events.on("update", this.lifecycleUpdate, this);
    if (this.postUpdate) scene.events.on("postupdate", this.lifecyclePostUpdate, this);

    // If needed, this could also be extended to listen for other scene events: render, pause,
    // resume, sleep, wake

    this.isDestroyed = false;
  }

  lifecyclePreUpdate(...args) {
    if (!this.isDestroyed) this.preUpdate(...args);
  }

  lifecycleUpdate(...args) {
    if (!this.isDestroyed) this.update(...args);
  }

  lifecyclePostUpdate(...args) {
    if (!this.isDestroyed) this.postUpdate(...args);
  }

  destroy() {
    this.isDestroyed = true;
    if (this.preUpdate) this.scene.events.off("preupdate", this.lifecyclePreUpdate, this);
    if (this.update) this.scene.events.off("update", this.lifecycleUpdate, this);
    if (this.postUpdate) this.scene.events.off("postupdate", this.lifecyclePostUpdate, this);
  }
}
