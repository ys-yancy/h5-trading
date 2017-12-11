'use strict';

var PageBase = require('../../../app/page-base');
var Core = require('../common/core');
var Uri = require('../../../app/uri');
var Config = require('../../../app/config');
var Sticky = require('../../../common/sticky');
require('../common/header');
var Header = require('../../../common/header');
var tmpl = require('./index.ejs');

export default class Trade extends PageBase {
  constructor() {
    super();
    this.configStatistics();

    this.inviteCode = new Uri().getParam('inviteCode');
    this.core = new Core({
      inviteCode: this.inviteCode
    });
    $('nav').sticky();

    new Header();

    var historyHref = $('#tradeHistory').attr('href');
    var href = $('#trade').attr('href');

    $('#tradeHistory').attr('href', historyHref + '?from=' + encodeURIComponent(new Uri().getParam('from')) + '&inviteCode=' + this.inviteCode);
    $('#trade').attr('href', href + '?from=' + encodeURIComponent(new Uri().getParam('from')) + '&inviteCode=' + this.inviteCode);

    this.core.getData().then((data) => {
      this.data = data;
      return this._render();
    }, (data) => {
      if (data.status == 403) {
        $('#J_DemoList').html('<li class="item J_Item auth">Ta的当前交易不允许别人查看</li>');
        $('#J_DemoList').parent().css({
          background: '#fff'
        });
      }
    });

    this.core.getInfo().then((data) => {
      var rate = data.month_rate_of_return * 100;

      var integer = parseInt(rate);
      var floatNum = Math.abs(rate - integer);
      floatNum = (floatNum).toFixed(2).slice(1);

      $('#J_Rate').html(integer + '<span class="dotted">' + floatNum + '</span>');

      var total = data.gross_profit;
      // this._setTotal(total);
    });

    this.core.getHistory().then((data) => {
      var total = 0;
      data.tickets.forEach((item) => {
        total += parseFloat(item.profit) + parseFloat(item.swap) - item.commission;
      });

      // var integer = parseInt(total);
      // var floatNum = total - integer;
      // floatNum = (floatNum).toFixed(2).slice(1);

      // $('#J_Count').text(data.tickets.length);
      // $('#J_Profit').html(integer + '<span class="dotted">' + floatNum + '</span>');
    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }

  _render() {
    return this.core.getRealTimeOrder(this.core.parseOrder(this.data)).then((results) => {
      this.render(tmpl, results, $('#J_DemoList'));
      this._setTotal(results.total);
      this._setCount(results.tickets.length);

      setTimeout(() => {
        this._render();
      }, Config.getInterval());
    });
  }

  _setTotal(total) {
    var totalInteger = parseInt(total);
    var totalFloatNum = Math.abs(total - totalInteger);
    totalFloatNum = (totalFloatNum).toFixed(2).slice(1);

    $('#J_Profit').html(totalInteger + '<span class="dotted">' + totalFloatNum + '</span>');
  }

  _setCount(count) {
    $('#J_Count').html(count);
  }

}

new Trade();