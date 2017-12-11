'use strict';

var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Util = require('../../../app/util');
var tmpl = require('./index.ejs');
require('../common/header');
var Header = require('../../../common/header');
var Sticky = require('../../../common/sticky');

// console.log(Util)

class SortProfit extends PageBase {
  constructor() {
    super();
    this.configStatistics();
    this._getData();

    var date = new Date();

    //$('.month').addClass('month-' + (date.getMonth() + 1));
    // $('.J_Month').text(date.getMonth() + 1);
    // $('#J_Month').text(date.getMonth() + 1);
    // $('.J_Date').text(Util.formateDate(this.currentMonthLast().getTime(), 'YYYY-MM-DD'));

    this._bind();

    new Header();
    $('nav').sticky();

    this._checkHeader();
  }

  _checkHeader() {
    var s = window.location.search;
    if (s) {
      $.each($('.sort'), function( index, value ) {
        value.href += s;
      });
    }
  }

  _bind() {
    $('.J_Close').on('click', (e) =>{
      $('#J_Popup').hide();
    });
    $('.J_ShowDialog').on('click', (e) =>{
      $('#J_Popup').show();
    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

    if (getWXWL() == 'ifbao') {
      $('.list').on('click', 'a', function() {
        return false;
      })
    }
  }

  _getData() {
    var self = this;

    this.ajax({
      // 15: 最近15个自然日
      // 10: 一次返回10个人
      url: '/v1/rank/user_profit/15/10',
      data: {
          wl: getWXWL()
      }
    }).then((data) => {
      data = data.data;

      data.forEach((item) => {
        item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();
      });
      // $('.J_Price').text(d.month_total_reward);

      self.render(tmpl, data, $('#J_List'));

      // 添加微信分享

    });
  }

}

new SortProfit();