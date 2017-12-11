'use strict';

var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var InfinityScroll = require('../../../common/infinite-scroll/index');
var tmpl = require('./index.ejs');
require('../common/header');
var Header = require('../../../common/header');
var Sticky = require('../../../common/sticky');
var Config = require('../../../app/config');

class BestMonth extends PageBase {
  constructor() {
    super();
    this.configStatistics();
    this._getData();

    $('#J_Month').text(new Date().getMonth() + 1);

    new Header();
    $('nav').sticky();
    
    this._checkHeader();
    
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _checkHeader() {
    var s = window.location.search;
    if (s) {
      $.each($('.sort'), function( index, value ) {
        value.href += s;
      });
    }
  }

  _getData() {
    this.ajax({
      url: '/v1/rank/order/profit/most',
      equity_threshold: Config.getRankEquityThreshold()
    }).then((data) => {
      data = data.data;

      console.log(data);

      this.render(tmpl, data, $('.list'));
      console.log(data);
    });
  }
}

new BestMonth();