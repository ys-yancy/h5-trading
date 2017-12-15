var webpack = require('webpack');
//var underscore = require('underscore');
//var ExtractTextPlugin = require("extract-text-webpack-plugin");

var entryAll = {
    'login': './src/p/login/index',
    'guides': './src/p/guides/index',
    'home': './src/p/home/index',
    'option': './src/p/option/index',
    'rapid': './src/p/rapid/index',
    'pro-trading': './src/p/pro-trading/index',
    'pro-chart': './src/p/pro-chart/index',
    'pro-list': './src/p/pro-list/index',
    'trade': './src/p/trade/index',
    'order': './src/p/order/index',
    'trade-history': './src/p/trade-history/index',
    'order-history': './src/p/order-history/index'
};

module.exports = {
  entry: entryAll,
  output: {
    path: __dirname + '/build/',
    filename: '[name].js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      query: {
        presets: ['es2015', 'stage-0'],
        "plugins": [
          "add-module-exports",
          "transform-decorators-legacy",
          "transform-class-properties",
        ]
      }
    }, {
      test: /\.css$/,
      loader: 'style-loader!css-loader'
        // loader: ExtractTextPlugin.extract("style-loader", "css-loader")
    }, {
      test: /\.ejs\.html$/,
      loader: "ejs-loader"
    }, {
      test: /\.ejs$/,
      loader: "ejs-loader"
    }]
  },
  devtool: 'source-map',
  devServer: {
    port: 9999
  }
};
