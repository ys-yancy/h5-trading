'use strict';

var PageBase = require('../../../app/page-base');
var session = require('../../../app/session');

export default class Trade extends PageBase {
  constructor(config) {
    super(config);
  }

  getData() {
    return this.ajax({
      url: '/v1/user/profile/order/current/',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data;

      return data;
    });
  }

  parseOrder(data) {
    // if (this.order) {
    //   var d = new $.Deferred();
    //   d.resolve(this.order);

    //   return d.promise();
    // }



    // return this.getData().then((data) => {
    var symbols = [];
    var total = 0;
    var tickets = [];
    var order = {};

    data.tickets.forEach((item) => {
      if (symbols.indexOf(item.symbol) == -1) {
        symbols.push(item.symbol)
      }
    });

    order.symbols = symbols; 

    // 模拟账户信息
    order.account = {
      demo: {
        currency: data.currency.demo,
        group_name: data.group_name.demo || 'demo_default'
      },
      real: {
        currency: data.currency.real,
        group_name: data.group_name.real || 'real_default'
      }
    };

    // window.cacheAccount = order.account;
    session.set('group', order.account);
    // session.set('account', order)

    order.tickets = data.tickets;

    this.order = order;

    return order;
    // });
  }

  getOrderInfo() {
    return this.getData().then((data) => {
      this.parseOrder(data);
    })
  }

  getOrder() {
    return this.getData().then((data) => {
      var order = this.parseOrder(data);
      return this.getRealTimeOrder(order);
    });
  }

  getRealTimeOrder(order) {
    var tickets = [];
    var total = 0;

    // return this.getOrder().then((order) => {
    return this.getFloatingProfit(order.account, order.tickets, order.symbols).then((profits, profitList) => {
      order.tickets.forEach((item) => {

        item.profits = profitList[item.ticket];

        // item.profits = parseFloat(item.profit) + parseFloat(item.swap) - item.commission;
        // 前台只显示盈利订单
        /*
        if (item.profits > 0) {
          tickets.push(item);
        }
        */
        // 前台显示所有订单
        tickets.push(item);
        total += item.profits;
      });

      var sortTickets = tickets.sort(function(item1, item2) {
        return item2.profits - item1.profits;
      });

      return {
        profitTickets: sortTickets,
        profit: profits,
        total: total,
        tickets: order.tickets
      }
    });
    // });
  }

  getInfo() {
    return this.ajax({
      url: '/v1/user/profile/info',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data;

      return data;
    });
  }

  getHistory() {
    return this.ajax({
      url: '/v1/user/profile/order/history',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {

      return data.data;
    });
  }
}