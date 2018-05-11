// Shared Webpack Configuration
// Plugins
const webpack = require('webpack'); // webpack built-in plugins
const HtmlWebpackPlugin = require('html-webpack-plugin');
const sGrid = require('s-grid');
const AutoprefixerStylus = require('autoprefixer-stylus');
// Helper for resolving paths
const helpers = require('./helpers.js');


module.exports = {
  entry: {
    'vendor': './src/vendor.ts',
    'app': './src/main.ts'
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },

  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: [
          {
            loader: 'awesome-typescript-loader',
            options: {
              configFileName: 'tsconfig.json'
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

    new webpack.optimize.CommonsChunkPlugin({
      name: ['app', 'vendor']
    }),

    new HtmlWebpackPlugin({
      template: './src/index.html',
      favicon: './src/favicon.ico',
      // title: 'Dev CMS',
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
