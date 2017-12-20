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
    'order-history': './src/p/order-history/index',
    'master-list': './src/p/master-list/index',
    'master-order': './src/p/master-order/index',
    'followlist': './src/p/followlist/index',
    'follow-order': './src/p/follow-order/index',
    'followlist-history': './src/p/followlist-history/index',
    'actual-order': './src/p/actual-order/index',
    'news': './src/p/news/index',
    'calendar': './src/p/calendar/index',
    'share-order': './src/p/share-order/index',
    'my/profile/index': './src/p/my/profile/index',
    'my/data/index': './src/p/my/data/index',
    'weixin/profile': './src/p/weixin/profile/index'
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
