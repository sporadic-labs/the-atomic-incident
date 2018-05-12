/* eslint-env node */
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const UglifyWebpackPlugin = require("uglifyjs-webpack-plugin");

module.exports = {
  mode: "production",
  module: {
    rules: [
      {
        test: /\.(scss|sass)$/,
        use: [
          MiniCssExtractPlugin.loader,
          { loader: "css-loader", options: { sourceMap: true } },
          { loader: "sass-loader", options: { sourceMap: true } }
        ]
      }
    ]
  },
  plugins: [
    new webpack.DefinePlugin({
      PRODUCTION: true
    }),

    new UglifyWebpackPlugin({ sourceMap: true, parallel: true, extractComments: true }),

    new MiniCssExtractPlugin({ filename: "[name].[hash].css", chunkFilename: "[id].[hash].css" })
  ],
  devtool: "source-map"
};
