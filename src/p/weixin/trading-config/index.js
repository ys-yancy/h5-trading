"use strict";

// require('../../../lib/zepto');
var Header = require('../../../common/header');
var PageBase = require('../../../app/page-base');
var Util = require('../../../app/util');
var Config = require('../../../app/config');

var Toast = require('../../../common/toast');
var Sticky = require('../../../common/sticky');
var Dialog = require('../../../common/dialog');


require('../../my/common/header');

// var tmpl = require('./index.ejs');

class TradingConfig extends PageBase {
  constructor() {
    super();
    this.login().then(function() {
      this._requires();
      this._initAttrs();
      this._bind();
      this.configStatistics();
    }.bind(this), function() {
      location.href = '../option.html';
    });
  }


  _bind() {
    var doc = $(document);

    // doc.on('tap', '.J_Quan', $.proxy(this._quan, this));

    $('.J_Standard').on('click', $.proxy(this._switchUI, this));
    $('.J_Fast').on('click', $.proxy(this._switchUI, this));

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  // 切换交易UI
  _switchUI() {
    // 标准交易是4, 极速交易是5
    if (this.tradingUI == 4) {
      this.tradingUI = 6;
      $('.J_Standard').addClass('off');
      $('.J_Fast').removeClass('off');
    }
    else {
      this.tradingUI = 4;
      $('.J_Standard').removeClass('off');
      $('.J_Fast').addClass('off');
    }
    Cookie.set('tradingUI', this.tradingUI);
  }


  _requires() {
    // var header = new Header();
    // header.show();
    // new Header();

    $('header').sticky();
  }

  _initAttrs() {
    // this.containerEl = $('#J_List');
    // this.url = '//weixin.invhero.com/api/today_recommend';
    this.tradingUI = Cookie.get('tradingUI') || getDefaultTradingUI();
    if (this.tradingUI == 4) {
      $('.J_Standard').removeClass('off');
      $('.J_Fast').addClass('off');
    }
    else {
      $('.J_Standard').addClass('off');
      $('.J_Fast').removeClass('off');
    }
  }

}

new TradingConfig();