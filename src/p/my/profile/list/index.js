'use strict';

var PageBase = require('../../../../app/page-base');
var Config = require('../../../../app/config');
var Core = require('../../common/core');
var tmpl = require('./index.ejs');

export default class Info extends PageBase {
  constructor(config) {
    super(config);
    this.configStatistics();
    this._getData();
    this.core = new Core();
    this.core.inviteCode = this.inviteCode;
  }

  _getData() {
    return this.ajax({
      url: '/v1/user/profile/order/current/',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data;
      // var symbols = [];
      // var total = 0;
      // var tickets = [];
      // data.tickets.forEach((item) => {
      //   if (symbols.indexOf(item.symbol) == -1) {
      //     symbols.push(item.symbol)
      //   }
      // });

      // this.symbols = symbols;

      // // 模拟账户信息
      // this.account = {
      //   demo: {
      //     currency: data.currency.demo,
      //     group_name: data.group_name.demo
      //   },
      //   real: {
      //     currency: data.currency.real,
      //     group_name: data.group_name.real
      //   }
      // };

      // this.tickets = data.tickets;
      this.data = data;

      this._render();

      // this._interval();

      // $('#J_List').html('<li class="auth">Ta的当前交易不允许别人查看 <a href="./trade-history.html">查看历史交易</a></li>');

      // $('#J_Total').text((total).toFixed(2));
      // });
    }, (data) => {
      if (data.status == 403) {
        this.core.getHistory().then((data) => {
          $('#J_List').html('<li class="auth">Ta的当前交易不允许别人查看 <a href="./trade-history.html?inviteCode=' + this.inviteCode + '">查看历史交易</a></li>');
        }, (data) => {
          if (data.status == 403) {
            $('#J_List').html('<li class="auth">Ta的当前交易不允许别人查看</li>')
          }
        });
      }
    });

  }

  _render() {
    return this.core.getRealTimeOrder(this.core.parseOrder(this.data)).then((results) => {
      // console.log(results);
      this.render(tmpl, {
        tickets: results.profitTickets,
        // profitList: profitList,
        inviteCode: this.inviteCode
      }, this.el);

      // $('.J_TotalProfit').text(parseInt(results.total) || 0);

      setTimeout(() => {
        this._render();
      }, Config.getInterval());
    });

    // var tickets = [];
    // var total = 0;

    // this.getFloatingProfit(this.account, this.tickets, this.symbols).then((profits, profitList) => {
    //   this.tickets.forEach((item) => {

    //     item.profits = profitList[item.ticket];

    //     // item.profits = parseFloat(item.profit) + parseFloat(item.swap) - item.commission;
    //     if (item.profits > 0) {
    //       tickets.push(item);
    //     }
    //     total += item.profits;
    //   });

    //   tickets = tickets.sort(function(item1, item2) {
    //     return parseFloat(item1.profits) < parseFloat(item2.profits);
    //   });

    //   this.render(tmpl, {
    //     tickets: tickets,
    //     // profitList: profitList,
    //     inviteCode: this.inviteCode
    //   }, this.el);

    //   $('.J_TotalProfit').text(parseInt(total) || 0);
    // });


  }
}