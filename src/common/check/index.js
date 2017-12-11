'use strict';

var Base = require('../../app/page-base');
// var tmpl = require('./toast.ejs.html');
var Toast = require('../toast');
var Cookie = require('../../lib/cookie');
// require('object.values');


export default class UpdateOrder extends Base {
  constructor() {
    super();

    // this.toastEl = $('#J_ToastWrapper');
    this._bind();

    // this.shouldOpenOrder({ ticket: 20233982 })
  }

  _bind() {
    this.subscribe('stomp:price:update', (e) => {
      this.check(e);
    }, this);

    this.subscribe('check:closed', () => {
      this._orders(this.symbolType.guadan).forEach((order) => {
        this.shouldOpenOrder(order);
      });
      this._orders(this.symbolType.normal).forEach((order) => {
        this.shouldCloseOrder(order);
      });
    });

    this.subscribe('get:orderList', (data) => {
      var symbolType = {
        normal: {},
        guadan: {}
      };

      data.list.forEach((item) => {
        if (item.status === 'pending') {
          // guadanList.push(item);

          if (!symbolType.guadan[item.symbol]) {
            symbolType.guadan[item.symbol] = [];
          }

          symbolType.guadan[item.symbol].push(item);
        } else {
          // normalList.push(item);

          if (!symbolType.normal[item.symbol]) {
            symbolType.normal[item.symbol] = [];
          }

          symbolType.normal[item.symbol].push(item);
        }
      });

      this.update(symbolType);
    });

    // this.toastEl.on('click', '.close', (e) => {
    //   var curEl = $(e.currentTarget);
    //   var parentEl = curEl.parent().parent();
    //   parentEl.fadeOut(.5);
    //   setTimeout(() => {
    //     parentEl.remove();
    //   }, 1 * 1000);
    // });
  }

  update(symbolType) {
    this.symbolType = symbolType;
  }

  _orders(symbolType) {
    var orders = [];

    for (var i in symbolType) {
      if (symbolType.hasOwnProperty(i)) {
        orders = orders.concat(symbolType[i]);
      }
    }

    return orders;
  }

  check(e) {
    this._checkGuadan(e);
    this._checkNormal(e);
  }

  _checkNormal(e) {
    var normal = this.symbolType.normal;
    var orders = normal[e.symbol];

    if (!orders) {
      return;
    }

    orders.forEach((order) => {
      var stopLoss = parseFloat(order.stopLoss);
      var takeProfit = parseFloat(order.takeProfit);
      if (order.status == 'open') {
        if (order.cmd.indexOf('buy') != -1 && e.bidPrice) {
          if (stopLoss && e.bidPrice < stopLoss) {
            this.shouldCloseOrder(order);
          } else if (takeProfit && e.bidPrice > takeProfit) {
            this.shouldCloseOrder(order);
          }
        } else if (order.cmd.indexOf('sell') != -1 && e.askPrice) {
          if (stopLoss && e.askPrice > stopLoss) {
            this.shouldCloseOrder(order);
          } else if (takeProfit && e.askPrice < takeProfit) {
            this.shouldCloseOrder(order);
          }
        }
      }

    });
  }

  _checkGuadan(e) {
    var guadan = this.symbolType.guadan;
    var orders = guadan[e.symbol];

    if (!orders) {
      return;
    }

    orders.forEach((order) => {
      if (order.status == 'pending') {
        if (order.cmd == 'buy stop' && e.askPrice) {
          if (e.askPrice > order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'buy limit' && e.askPrice) {
          if (e.askPrice < order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'sell stop' && e.bidPrice) {
          if (e.bidPrice < order.openPrice) {
            this.shouldOpenOrder(order);
          }
        } else if (order.cmd == 'sell limit' && e.bidPrice) {
          if (e.bidPrice > order.openPrice) {
            this.shouldOpenOrder(order);
          }
        }
      }
    });
  }
  shouldOpenOrder(order) {
    if (Cookie.get('type') == 'demo') {
      return;
    }

    var self = this;
    console.log(`check order open ${order.ticket}`);
    // 如果正在检查，则不在检查
    if (this.queue[order.id || order.ticket]) {
      return;
    }
    this.queue[order.id || order.ticket] = true;

    this.ajax({
      url: '/v1/order/' + order.ticket + '?access_token=' + this.cookie.get('token')
    }).then((data) => {
      var curOrder = data.data;
      self.queue[order.id || order.ticket] = false;
      if (curOrder.status === 'open') {
        console.log(`订单：${order.ticket} 已开仓`);
        this._showTips(curOrder, 'open');
        this._updateAccount();

        this.broadcast('play:guadan');
      } else if (curOrder.status === 'rejected') {
        console.log(`订单：${order.ticket} 挂单 rejected`);
        this._showTips(curOrder, 'rejected');
        this._updateAccount();
        this.broadcast('play:guadan');
      }
      /*
      // 检查是否开仓的订单没必要检查 status = closed
      else if (curOrder.status === 'closed') {
        console.log(`订单：${order.ticket} 被平仓`);

        this._showTips(curOrder, 'closed');

        this._updateAccount();
      } 
      // 检查是否开仓的订单没必要检查 closeType = margin_check
      else if (curOrder.status == 'margin_check') {
        console.log(`订单：${order.ticket} 强制平仓`);

        this._showTips(curOrder, ' margin_check');

        this._updateAccount();
      }
      */
    });
  }

  shouldCloseOrder(order) {
    if (Cookie.get('type') == 'demo') {
      return;
    }
    var self = this;
    console.log(`check order close ${order.ticket}`);
    // 如果正在检查，则不在检查
    if (this.queue[order.id || order.ticket]) {
      return;
    }
    this.queue[order.id || order.ticket] = true;

    this.ajax({
      url: '/v1/order/' + order.ticket + '?access_token=' + this.cookie.get('token')
    }).then((data) => {
      var curOrder = data.data;
      self.queue[order.id || order.ticket] = false;
      /*

      // 检查是否需要平仓的接口, 没必要处理 status = open, rejected
      if (curOrder.status === 'open') {
        console.log(`订单：${order.ticket} 已开仓`);
        this._showTips(curOrder, 'open');
        this._updateAccount();
      } else 
      
      if (curOrder.status === 'rejected') {
        console.log(`订单：${order.ticket} 挂单 rejected`);
        this._showTips(curOrder, 'rejected');
        this._updateAccount();
      } else
      */
      if (curOrder.status === 'closed') {
        console.log(`订单：${order.ticket} 被平仓`);

        this.broadcast('order:force:close', { ticket: order.ticket });

        if (curOrder.closeType === 'margin_check') {
          this._showTips(curOrder, 'margin_check');
        } else {
          this._showTips(curOrder, 'closed');
        }

        this._updateAccount();
      }
      /*
      // 强制平仓订单的 status = closed, closeType=margin_check
      else if (curOrder.status == 'margin_check') {
        console.log(`订单：${order.ticket} 强制平仓`);

        this._showTips(curOrder, ' margin_check');

        this._updateAccount();
      }
      */
    });
  }

  _showTips(order, type) {
    var msg = `订单：${order.ticket || order.id} ${type === 'closed' ? '平仓' : type === 'rejected' ? '拒绝开仓' : type === 'margin_check' ? '强制平仓' : '开仓'} <br/> ${type !== 'open' ? '盈利：' + order.profit : ''}`;

    new Toast(msg);

    // 这里要处理从列表中移除或添加的逻辑 

    var normalOrders = this.symbolType.normal[order.symbol];
    var guadanOrders = this.symbolType.guadan[order.symbol];

    // status: open -> closed, margin_check 需要从 normal 里移除
    if (type === 'closed' || type === 'margin_check') {
      normalOrders.forEach(function(o, index) {
        if (o.ticket == order.ticket) {
          normalOrders.splice(index, 1);
          console.log('remove order from normal: ' + order.ticket);
        }
      });
    }
    // status: pending -> rejected 需要从 guadan 里移除
    else if (type === 'rejected') {
      guadanOrders.forEach(function(o, index) {
        if (o.ticket == order.ticket) {
          guadanOrders.splice(index, 1);
          console.log('remove order from guadan: ' + order.ticket);
        }
      });
    }
    // status: pending -> open 需要从 guadan 里移除, 添加到 normal
    else if (type === 'open') {
      guadanOrders.forEach(function(o, index) {
        if (o.ticket == order.ticket) {
          guadanOrders.splice(index, 1);
          normalOrders.push(order);
          console.log('remove order from guadan and add to normal: ' + order.ticket);
        }
      });
    }


    if (window.location.href.indexOf('trade.html') != -1) {
      this.broadcast('remove:ticket', { ticket: order.ticket || order.id });
    }
    // var el = this.renderTo(tmpl, {
    //   order: order,
    //   type: type
    // }, this.toastEl);
    // setTimeout(() => {
    //   el.fadeOut(1, () => {
    //     el.remove();
    //   });
    // }, 3 * 1000);
  }

  _updateAccount() {
    this.broadcast('update:account', {
      fresh: true
    });
  }

  defaults() {
    return {
      queue: {},
      symbolType: {
        normal: {},
        guadan: {}
      }
    };
  }
}
