const webpack = require('webpack');
const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const path = require('path');
const BundleTracker = require('webpack-bundle-tracker');
const UglifyEsPlugin = require('uglify-es-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = merge(common, {
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new BundleTracker({ filename: 'webpack-stats.json' }),
    new UglifyEsPlugin(),
    new webpack.ProvidePlugin({
      $: 'jquery',
      jQuery: 'jquery',
      'window.jQuery': 'jquery'
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, 'static/img/'),
          to: path.resolve(__dirname, 'dist/img/')
        },
        {
          from: path.resolve(__dirname, 'static/css/'),
          to: path.resolve(__dirname, 'dist/css/')
        },
        {
          from: path.resolve(__dirname, 'static/js/'),
          to: path.resolve(__dirname, 'dist/js/')
        },
        {
          from: path.resolve(__dirname, 'static/fonts/'),
          to: path.resolve(__dirname, 'dist/fonts/')
        }
      ]
    })
  ]
});
