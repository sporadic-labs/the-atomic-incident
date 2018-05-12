/* eslint-env node */
const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  context: path.resolve(__dirname, "..", "src"),
  entry: "./js/main.js",
  cache: true,
  output: {
    path: path.resolve(__dirname, "..", "public"),
    filename: "main.js"
  },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, use: "babel-loader", exclude: /node_modules/ },

      {
        test: /\.svg$/,
        use: { loader: "preact-svg-loader" }
      },

      //   Ensure that urls in scss are loaded correctly
      {
        test: /\.(eot|ttf|woff|woff2|png|jpg)$/,
        use: {
          loader: "file-loader",
          options: {
            // Default is node_modules -> _/node_modules, which doesn't work with gh-pages.
            // Instead, don't use [path], just use a [hash] to make file paths unique.
            name: "static/[name].[hash:8].[ext]"
          }
        }
      },

      // Allow shaders to be loaded via glslify
      { test: /\.(glsl|frag|vert)$/, use: ["raw-loader", "glslify"], exclude: /node_modules/ }
    ]
  },
  resolve: {
    alias: {
      react: "preact-compat",
      "react-dom": "preact-compat"
    }
  },
  plugins: [
    new webpack.DefinePlugin({
      "typeof CANVAS_RENDERER": JSON.stringify(true),
      "typeof WEBGL_RENDERER": JSON.stringify(true)
    }),

    new HTMLWebpackPlugin({ template: "./index.html" }),

    // Instead of using imports & file loader for Phaser assets, just copy over all resources
    new CopyWebpackPlugin([
      {
        from: "./resources",
        to: "resources/",
        ignore: ["audio/audacity/**/*", "atlases/*-frames/**/*"]
      }
    ])
  ]
};
