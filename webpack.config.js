var webpack = require('webpack');

var entryAll = {
    'login': './src/p/login/index',
    'register': './src/p/register/index',
    'recovery-password': './src/p/recovery-password/index',
    'recovery-trade-password': './src/p/recovery-trade-password/index',
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
    'followorder-history': './src/p/followorder-history/index',
    'followlist-history': './src/p/followlist-history/index',
    'actual-order': './src/p/actual-order/index',
    'news': './src/p/news/index',
    'calendar': './src/p/calendar/index',
    'share-order': './src/p/share-order/index',
    'my/profile/index': './src/p/my/profile/index',
    'my/data/index': './src/p/my/data/index',
    'weixin/profile': './src/p/weixin/profile/index',
    'friends/invite': './src/p/friends/invite/index',
    'share': './src/p/share/index',
    'account': './src/p/account/index',
    'account/pocket': './src/p/account/pocket/index',
    'cat': './src/p/cat/index',
    'feedback': './src/p/feedback/index',
    'client-agreement': './src/p/client-agreement/index',
    'risk-message': './src/p/risk-message/index',
    'recharge': './src/p/recharge/index',
    'stf-kuaijie-pay/index': './src/p/stf-kuaijie-pay/index',
    'extract': './src/p/extract/index',
    'open-account': './src/p/open-account/index',
    'inbox': './src/p/inbox/index',
    'cs': './src/p/cs/index',
    'my-guide/yhb/login': './src/p/my-guide/yhb/login/index',
    'my-guide/yhb/register': './src/p/my-guide/yhb/register/index',
    'my-guide/jstzlc/login': './src/p/my-guide/jstzlc/login/index',
    'my-guide/jstzlc/register': './src/p/my-guide/jstzlc/register/index'
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
