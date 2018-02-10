import FontFaceObserver from "fontfaceobserver";
import fonts from "./fonts";

const fontObservers = [];

fonts.forEach(font => {
  font.weights.forEach(weight => {
    font.styles.forEach(style => {
      fontObservers.push(new FontFaceObserver(font.family, { weight, style }));
    });
  });
});

// Return a promise that will resolve when all fonts are registered as loaded
export default function load(timeout) {
  return Promise.all(fontObservers.map(observer => observer.load(null, timeout)));
}
