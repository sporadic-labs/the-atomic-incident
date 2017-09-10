/* eslint-env node */
const path = require("path");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  context: path.resolve(__dirname, "src"),
  entry: "./js/main.js",
  output: {
    path: path.resolve(__dirname, "public"),
    filename: "main.js"
  },
  module: {
    rules: [
      { test: /\.(js|jsx)$/, use: "babel-loader" },
      {
        test: /\.(scss|sass)$/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: [
            { loader: "css-loader", options: { sourceMap: true } },
            { loader: "sass-loader", options: { sourceMap: true } }
          ]
        })
      },

      //   Ensure that urls in scss are loaded correctly
      {
        test: /\.(eot|svg|ttf|woff|woff2|png|jpg)$/,
        use: {
          loader: "file-loader",
          options: {
            name: "[path][name].[ext]"
          }
        }
      },

      // Allow shaders to be loaded via glslify
      { test: /\.(glsl|frag|vert)$/, use: ["raw-loader", "glslify"] },

      // Load Phaser and deps as globals (required for Phaser v2)
      { test: /pixi\.js/, use: { loader: "expose-loader", options: "PIXI" } },
      { test: /p2\.js/, use: { loader: "expose-loader", options: "p2" } },
      {
        test: /phaser-split\.js$/,
        use: { loader: "expose-loader", options: "Phaser" }
      }
    ]
  },
  resolve: {
    alias: {
      react: "preact-compat",
      "react-dom": "preact-compat"
    }
  },
  plugins: [
    new HTMLWebpackPlugin({ template: "./index.html" }),
    new ExtractTextPlugin({ filename: "[name].[contenthash].css", allChunks: true }),

    // Instead of using imports & file loader for Phaser assets, just copy over all resources
    new CopyWebpackPlugin([
      {
        from: "./resources",
        to: "resources/",
        ignore: ["audio/audacity/**/*", "atlases/*-frames/**/*"]
      }
    ])
  ],
  devtool: "source-map"
};
