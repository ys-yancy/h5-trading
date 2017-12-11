'use strict';

var PageBase = require('../../../app/page-base');
var Core = require('../common/core');
var Uri = require('../../../app/uri');
var Sticky = require('../../../common/sticky');
require('../common/header');
var Header = require('../../../common/header');
var tmpl = require('./index.ejs');
var Util = require('../../../app/util');

export default class Trade extends PageBase {
  constructor() {
    super();

    this.configStatistics();
    $('nav').sticky();

    new Header();

    this.inviteCode = new Uri().getParam('inviteCode');

    var historyHref = $('#tradeHistory').attr('href');
    var href = $('#trade').attr('href');

    $('#tradeHistory').attr('href', historyHref + '?from=' + encodeURIComponent(new Uri().getParam('from')) + '&inviteCode=' + this.inviteCode);
    $('#trade').attr('href', href + '?from=' + encodeURIComponent(new Uri().getParam('from')) + '&inviteCode=' + this.inviteCode);

    this.core = new Core({
      inviteCode: this.inviteCode
    });


    this.core.getInfo().then((data) => {
      var rate = data.month_rate_of_return * 100;

      var integer = parseInt(rate);
      var floatNum = Math.abs(rate - integer);
      floatNum = (floatNum).toFixed(2).slice(1);

      $('#J_Rate').html(integer + '<span class="dotted">' + floatNum + '</span>');

      var total = data.gross_profit;
      var totalInteger = parseInt(total);
      var totalFloatNum = Math.abs(total - totalInteger);
      totalFloatNum = (totalFloatNum).toFixed(2).slice(1);

      $('#J_Profit').html(totalInteger + '<span class="dotted">' + totalFloatNum + '</span>');
    });

    this.core.getHistory().then((data) => {
      var total = 0;
      data.tickets.forEach((item) => {
        total += parseFloat(item.profit) + parseFloat(item.swap) - item.commission;
      });

      data.tickets = data.tickets.sort(function(v1, v2) {
        return Util.getTime(v2.openTime) - Util.getTime(v1.openTime)
      });

      console.log(data.tickets)

      this.render(tmpl, data, $('#J_DemoList'));
      $('#J_Loading').hide();
      $('#J_Count').text(data.tickets.length);

      // var integer = parseInt(total);
      // var floatNum = total - integer;
      // floatNum = (floatNum).toFixed(2).slice(1);

      // $('#J_Count').text(data.tickets.length);
      // $('#J_Profit').html(integer + '<span class="dotted">' + floatNum + '</span>');
    }, (data) => {
      if (data.status == 403) {
        $('#J_DemoList').html('<li class="item J_Item auth">Ta的历史交易不允许别人查看</li>');
        $('#J_DemoList').parent().css({
          background: '#fff'
        });
        $('#J_Loading').hide();
      }
    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  }


}

new Trade();