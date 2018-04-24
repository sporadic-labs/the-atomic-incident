/* eslint-env node */
const path = require("path");
const webpack = require("webpack");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = function(env, argv) {
  const isDev = argv.mode !== "development";

  return {
    mode: "development",
    context: path.resolve(__dirname, "src"),
    entry: "./js/main.js",
    cache: true,
    output: {
      path: path.resolve(__dirname, "public"),
      filename: "main.js"
    },
    module: {
      rules: [
        { test: /\.(js|jsx)$/, use: "babel-loader", exclude: /node_modules/ },

        {
          test: /\.(scss|sass)$/,
          use: [
            isDev
              ? { loader: "style-loader", options: { sourceMap: true } }
              : MiniCssExtractPlugin.loader,
            { loader: "css-loader", options: { sourceMap: true } },
            { loader: "sass-loader", options: { sourceMap: true } }
          ]
        },

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
              name: "[path][name].[ext]"
            }
          }
        },

        // Allow shaders to be loaded via glslify
        { test: /\.(glsl|frag|vert)$/, use: ["raw-loader", "glslify"], exclude: /node_modules/ },

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
      new webpack.DefinePlugin({
        PRODUCTION: argv.mode !== "development"
      }),

      new HTMLWebpackPlugin({ template: "./index.html" }),

      new MiniCssExtractPlugin({ filename: "[name].[hash].css", chunkFilename: "[id].[hash].css" }),

      // Instead of using imports & file loader for Phaser assets, just copy over all resources
      new CopyWebpackPlugin([
        {
          from: "./resources",
          to: "resources/",
          ignore: ["audio/audacity/**/*", "atlases/*-frames/**/*"]
        }
      ])
    ],
    devtool: isDev ? "eval-source-map" : "source-map"
  };
};
