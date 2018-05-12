const merge = require("webpack-merge");
const common = require("./webpack.common.js");

const SpeedMeasurePlugin = require("speed-measure-webpack-plugin");
const smp = new SpeedMeasurePlugin();

module.exports = (env, argv) => {
  if (argv.mode === "development") {
    return smp.wrap(merge(common, require("./webpack.dev.js")));
  } else {
    return smp.wrap(merge(common, require("./webpack.prod.js")));
  }
};
