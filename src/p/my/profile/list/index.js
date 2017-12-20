'use strict';

var PageBase = require('../../../../app/page-base');
var Config = require('../../../../app/config');
var Core = require('../../common/core');
var currentTmpl = require('./current.ejs');
var historyTmpl = require('./history.ejs');

export default class Info extends PageBase {
  constructor(config) {
    super(config);
    this._bind();
    this._getData();
    this.core = new Core();
    this.core.inviteCode = this.inviteCode;
  }

  _bind() {
    var doc = $(document);

    doc.on('tap', '.nav-item', $.proxy(this._switch, this));
  }

  _switch(e) {
    var currentEl = $(e.target),
      parentEl = currentEl.parents('.list'),
      listEls = $('.J_List', parentEl),
      index = currentEl.index();
    
    if (currentEl.hasClass('active')) {
      return
    }

    if (currentEl.hasClass('no-load')) {
      currentEl.removeClass('no-load');
      this._getHistoryList();
    }

    currentEl.siblings().removeClass('active');
    currentEl.addClass('active');
    listEls.hide();
    $(listEls[index]).show();
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
      this.data = data;
      this._render();
    }, (data) => {
      if (data.status == 403) {
        $('#J_ListCurrent').html('<li class="auth">Ta的当前交易不允许别人查看</li>')
      }
    });

  }

  _getHistoryList() {
    this.core.getHistory().then((data) => {
        if (data.tickets > 100) {
          data.tickets = 100;
        }

        this.render(historyTmpl, {
          tickets: data.tickets
        }, this.historyEl);

    }, (data) => {
      if (data.status == 403) {
        $('#J_ListHistory').html('<li class="auth">Ta的历史交易不允许别人查看</li>')
      }
    });
  }

  _render() {
    return this.core.getRealTimeOrder(this.core.parseOrder(this.data)).then((results) => {
      // console.log(results);
      this.render(currentTmpl, {
        tickets: results.profitTickets,
        // profitList: profitList,
        inviteCode: this.inviteCode
      }, this.el);

      // $('.J_TotalProfit').text(parseInt(results.total) || 0);

      setTimeout(() => {
        // this._render();
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