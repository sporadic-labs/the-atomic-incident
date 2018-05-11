// Production Webpack Configuration

// Plugins
const webpack = require('webpack'); // webpack built-in plugins
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');
const sGrid = require('s-grid');
const AutoprefixerStylus = require('autoprefixer-stylus');
const CompressionPlugin = require("compression-webpack-plugin");
const { BaseHrefWebpackPlugin } = require('base-href-webpack-plugin');

// Helper for resolving paths
const helpers = require('./helpers.js');
// Environment variables for use in the Angular2 App
const ENV = process.env.NODE_ENV = process.env.ENV = 'production';
// Base Href
// NOTE(rex): Taken from config: { sub: 'folderName/' } in package.json.
const BH = process.env.npm_package_config_sub + '/';

module.exports = {
  entry: {
    'app': './src/prod.ts'
  },

  output: {
    filename: 'build.[hash].js',
    chunkFilename: '[id].[hash].chunk.js',
    path: helpers.root('.dist'),
    publicPath: BH,
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  devtool: 'source-map',

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: 'config/tsconfig.prod.json'
            }
          },
          {
            loader: 'angular2-template-loader',
          }
        ],
        include: [helpers.root('src'), helpers.root('node_modules', '@encurate')],
        exclude: [/\.(spec|e2e)\.ts$/, /node_modules\/(?!(@encurate)\/).*/]
      },
      {
        test: /\.html$/,
        use: 'html-loader'
      },
      {
        test: /\.(png|jpe?g|gif|svg|woff|woff2|ttf|eot|ico)$/,
        use: 'file-loader?name=img/[name].[hash].[ext]'
      },
      {
        test: /\.styl$/,
        use: [
          'raw-loader',
          'stylus-loader',
        ],
        include: [helpers.root('src', 'app')],
        exclude: [helpers.root('node_modules'), helpers.root('src', 'styles')]
      },
      {
        test: /\.styl$/,
        use: [
          'style-loader',
          'css-loader',
          'stylus-loader',
        ],
        include: [helpers.root('src', 'styles')],
        exclude: [helpers.root('node_modules'), helpers.root('src', 'app')]
      },
    ]
  },

  plugins: [
    // Workaround for angular/angular#11580
    new webpack.ContextReplacementPlugin(
      // The (\\|\/) piece accounts for path separators in *nix and Windows
      /angular(\\|\/)core(\\|\/)(esm(\\|\/)src|src)(\\|\/)linker/,
      helpers.root('./app'), // location of your app
      {} // a map of your routes
    ),

    // Enable production flag
    new webpack.DefinePlugin({
      'process.env': {
        'ENV': JSON.stringify(ENV)
      }
    }),

    new webpack.NoEmitOnErrorsPlugin(),

    /* NOTE(rex): Some of these options will mess with angular, mangle is a bit one.
     * I'm not going to dick around with this any more, but if you are back here,
     * prob check out additional options!
     */
    new UglifyJsPlugin({
      sourceMap: false,
      uglifyOptions: {
        // ecma: 8,
        warnings: false,
        mangle: false,
        // output: {
        //   comments: false,
        //   beautify: false,
        // },
        // toplevel: false,
        // ie8: false,
        // safari10: false,
      },
    }),


    new CompressionPlugin({
      asset: "[path].gz[query]",
      algorithm: "gzip",
      test: /\.js$|\.css$|\.html$/,
      threshold: 10240,
      minRatio: 0.8
    }),

    new webpack.LoaderOptionsPlugin({
      htmlLoader: {
        minimize: false // workaround for ng2
      }
    }),

    // Set base href in index
    new BaseHrefWebpackPlugin({ baseHref: BH }),

    new HtmlWebpackPlugin({
      template: './src/index.html',
      favicon: './src/favicon.ico',
    }),

    new webpack.ProvidePlugin({
      jQuery: 'jquery',
      $: 'jquery',
      jquery: 'jquery'
    }),

    new webpack.LoaderOptionsPlugin({
      test: /\.styl$/,
      stylus: {
        default: {
          use: [
            sGrid(),
            AutoprefixerStylus(),
          ],
        },
      },
    }),
  ],
};
