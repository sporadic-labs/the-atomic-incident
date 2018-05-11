// Merge multiple webpack config objects together!
const webpackMerge = require('webpack-merge');

// Plugins
const webpack = require('webpack'); // webpack built-in plugins
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const { CheckerPlugin } = require('awesome-typescript-loader'); // Needed if using --watch
var BrowserSyncPlugin = require('browser-sync-webpack-plugin');

// Shared Webpack configuration
const commonConfig = require('./webpack.common.js');
// Helper for resolving paths
const helpers = require('./helpers.js');
// Path to localhost certificate for https.
const pathToLocalhostCertificates = './config/localhost-cert/';
const pathToLocalhostKey = pathToLocalhostCertificates + 'local.key';
const pathToLocalhostCert = pathToLocalhostCertificates + 'local.crt';

// Environment variables for use in the Angular2 App
const ENV = process.env.NODE_ENV = process.env.ENV = 'development';


module.exports = webpackMerge(commonConfig, {
  output: {
    filename: '[name].js',
    chunkFilename: '[id].chunk.js',
    path: helpers.root('.dev'),
    publicPath: 'https://localhost:3030/',
  },

  devtool: 'inline-source-map',

  plugins: [
    new CheckerPlugin(),

    // ENV Variable
    new webpack.DefinePlugin({
      'process.env': {
        'ENV': JSON.stringify(ENV)
      }
    }),

    // NOTE(rex): Starts a server and opens a UI analyzing the contents of your app bundle.
    // new BundleAnalyzerPlugin({})
  ],

  devServer: {
    historyApiFallback: true,
    stats: 'minimal',
    https: {
      'key': pathToLocalhostKey,
      'cert': pathToLocalhostCert
    }
  }

});
