'use strict';

var PageBase = require('../../../app/page-base');
var Config = require('../../../app/config');
var Util = require('../../../app/util');
var tmpl = require('./index.ejs');
require('../common/header');
var Header = require('../../../common/header');
var Sticky = require('../../../common/sticky');

// console.log(Util)

class SortMonth extends PageBase {
  constructor() {
    super();
    this.configStatistics();
    this._getData();

    var date = new Date();

    $('.month').addClass('month-' + (date.getMonth() + 1));
    $('.J_Month').text(date.getMonth() + 1);
    $('#J_Month').text(date.getMonth() + 1);
    $('.J_Date').text(Util.formateDate(this.currentMonthLast().getTime(), 'YYYY-MM-DD'));

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
      url: '/v1/rank/config/',
      data: {
        wl: getWXWL()
      }
    }).then((data) => {
      var d = data.data;
      $('#J_EquityThrehold').text(d.equity_threshold);

      self.ajax({
        url: '/v1/rank/ror/month',
        data: {
          // 参赛最低净值要求, 按当月1日净值计算
          // 0531为了配合活动调整为50
          equity_threshold: d.equity_threshold,
          monthly_invite: d.monthly_invite,
          wl: getWXWL(),
          limit: 10
        }
      }).then((data) => {
        data = data.data;

        data.forEach((item) => {
          item.avatar = item.avatar ? Config.getAvatarPrefix(item.avatar) : getDefaultIconWL();
        });
        $('.J_Price').text(d.month_total_reward);

        self.render(tmpl, data, $('#J_List'));


        // 添加微信分享




      });

    });
  }

  /**
     * 获取当前月最后一天
     * @return
     */
  currentMonthLast() {
      var date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() + 1);
      return new Date(date.setDate(date.getDate() - 1));
    }

  lastMonthLast() {

    return lastMonthLast();

    /**
     * 获取当前月的第一天
     */
    function getCurrentMonthFirst() {
      var date = new Date();
      date.setDate(1);
      return date;
    }

    /**
     * 获取上个月最后一天
     * @return
     */
    function lastMonthLast() {
      return new Date(getCurrentMonthFirst().setDate(getCurrentMonthFirst().getDate() - 1));
    }

    
  }
}

new SortMonth();