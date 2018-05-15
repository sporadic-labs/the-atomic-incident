import getFontString from "../../fonts/get-font-string";

const style = {
  font: getFontString("Montserrat", { size: "26px", weight: 800 }),
  fill: "#FFEB6E"
};

export default class HudMessageDisplay {
  constructor(scene, hudContainer) {
    this.scene = scene;

    this.text = scene.add.text(750 / 2, 750, "", style);
    this.text.setOrigin(0.5, 1);
    hudContainer.add(this.text);

    this.messageQueue = [];
  }

  setMessage(text) {
    this.messageQueue.push(text);
    if (!this.isShowingMessage) this.showNextMessage();
    return this;
  }

  showNextMessage() {
    const text = this.messageQueue.shift();
    this.text.setText(text).setAlpha(0);

    this.isShowingMessage = true;

    this.timeline = this.scene.tweens
      .createTimeline()
      .add({
        targets: this.text,
        alpha: 1,
        ease: "Cubic.easeOut",
        duration: 200
      })
      .add({
        targets: this.text,
        alpha: 0,
        ease: "Cubic.easeIn",
        duration: 2000,
        delay: 2000
      })
      .on("complete", () => {
        this.isShowingMessage = false;
        if (this.messageQueue.length !== 0) this.showNextMessage();
        else this.timeline = null;
      });

    this.timeline.play();
  }

  destroy() {
    if (this.timeline) this.timeline.destroy();
  }
}
