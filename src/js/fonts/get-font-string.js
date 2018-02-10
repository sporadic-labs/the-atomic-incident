import fonts from "./fonts";

/**
 * Returns a formatted CSS string for a font, if the font has been preloaded. If not, throws an
 * error.
 * @param {string} family 
 * @param {object} [options] - font size, style and weight options 
 */
export default function getFontString(family, { size = 12, style = "normal", weight = 400 } = {}) {
  const isFound = fonts.find(
    f => f.family === family && f.styles.includes(style) && f.weights.includes(weight)
  );
  if (!isFound) throw new Error(`Font not preloaded: ${style} ${weight} ${family}`);
  else return `${style} ${weight} ${size} "${family}"`;
}
