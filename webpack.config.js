var webpack = require('webpack');
//var underscore = require('underscore');
//var ExtractTextPlugin = require("extract-text-webpack-plugin");

var entryAll = {
    home: './src/p/home/index',
    option: './src/p/option/index',
    trade: './src/p/trade/index',
    'pro-trading': './src/p/pro-trading/index',
    'login': './src/p/login/index',
    'guides': './src/p/guides/index'
};

var entryOptionOnly = {
    option: './src/p/option/index',
}
module.exports = {
  entry: entryAll,
  // entry: entryOptionOnly,
  output: {
    path: __dirname + '/build/',
    filename: '[name].js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      exclude: /node_modules/,
      loader: "babel-loader",
      // loader: 'babel', // 'babel-loader' is also a legal name to reference
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
  devtool: 'source-map'
};
