"use strict";

require('./index.css');
var PageBase = require('../../../../app/page-base');
var tmpl = require('./index.ejs.html');
var Toast = require('../../../../common/toast');

export default class OptionBanner extends PageBase {
  constructor(config) {
    super(config);


    this._setHeight();
    this._getOption();
    this._bind();
    this.getTotal();

  }

  _bind() {
    var doc = $(document);

    $('.J_OptionFold').on('click', $.proxy(this._fold, this));
    $('.J_OptionBannerMask').on('click', $.proxy(this._fold, this));
    this.bottomAccount.on('get:realFloatMargin', this._getFloatMargin, this);

    // this.subscribe('account:did:update', (e) => {});
    document.addEventListener('touchstart', function() {}, true);

    this.subscribe('action:option:success', this._success, this);

    this.el.on('click', '.item-o', (e) => {
      $(e.currentTarget).toggleClass('hover');
      $(e.currentTarget).siblings().removeClass('hover');
    });

    this.subscribe('stomp:price:update', (e) => {
      this.cacheSymbol[e.symbol] = e;
      this._progress(e.symbol, e);
    });

    this.el.on('click', '.J_CloseOrder', (e) => {
      var curEl = $(e.currentTarget);
      var itemEl = curEl.parent('.item-o');
      var orderId = itemEl.attr('data-order');

      this.close(orderId, curEl)
    });


    this.subscribe('order:force:close', (e) => {
      var index = this.props.currentOrderList.indexOf(e.ticket);

      if (index !== -1) {
        this.props.currentOrderList.splice(index, 1);
      }

      this.getTotal(true);
      this.broadcast('update:account', { fresh: true });
      $('.item-' + e.ticket).remove();
    });
  }


  close(id, curEl) {
    var p;
    var order = this.getListById(id);
    var price = this.cacheSymbol[order.symbol];

    if (order.cmd.toLowerCase().indexOf('buy') != -1) {
      p = price.bidPrice;
    } else {
      p = price.askPrice;
    }


    var self = this,
      data = {
        access_token: this.cookie.get('token'),
        slippage: order.slippage,
        closeprice: p
      };

    /**
     * b)平仓时: 对于不同交易类型的订单, closeprice应该使用:
     *   i.买跌(SELL): closeprice = ask_price;
     *   ii.买涨(BUY): closeprice = bid_price;
     */

    if (!this.isDemo()) {
      this.getRealToken().then((realToken) => {
        data.real_token = realToken;

        this.doClose(curEl, data, id);
      });

    } else {
      this.doClose(curEl, data, id);
    }


  }

  doClose(curEl, data, id) {
    this._showLoad(curEl);

    this.ajax({
      url: '/v1/order/close/' + id,
      type: 'post',
      data: data
    }).then((data) => {
      new Toast('平仓成功');
      curEl.parent('.item-o').remove();
      var i;
      (this.list || []).forEach((order, index) => {
        if (order.ticket == id) {
          i = index
        }
      });

      this.list.splice(i, 1);

      this.getTotal(true);

      this.broadcast('update:account', { fresh: true });
    }, (e) => {
      new Toast(e.message);
    });
  }

  getListById(id) {
    var order;
    (this.props.accountData.list || []).forEach((item) => {
      if (item.ticket == id) {
        order = item
      };
    });

    return order;
  }

  _getFloatMargin(floatMargin) {
    var listEl = this.isDemo() ? this.demoListEl : this.listEl;

    $('.item-o', listEl).each(function(index, item) {
      item = $(item);
      var floatEl = $('.float-p', item);
      var order = item.attr('data-order');
      try {

        floatEl.text(floatMargin[order].toFixed(2));
      } catch (e) {}
    });

  }


  _getCurPrice(list) {
    var symbols = [];

    $.each(list, function(index, item) {
      if (symbols.indexOf(item.symbol) === -1) {
        symbols.push(item.symbol);
      }
    });

    this.getCurrentPrice(symbols, true).then((data) => {
      $.each(data, (index, priceInfo) => {
        this.cacheSymbol[priceInfo.symbol] = priceInfo;
        var symbol = priceInfo.symbol;
        priceInfo.askPrice = priceInfo.ask_price[0];
        priceInfo.bidPrice = priceInfo.bid_price[0];

        this._progress(symbol, priceInfo);
      });
    });
  }

  // 更新
  fresh(list) {
    $('.item-o', this.el).each(function(index, item) {
      var ticket = $(item).attr('data-order');

      if (!InList(list, ticket)) {

        $(item).remove();
      }
    });

    Math.random() < 0.05 && this.getTotal();

    function InList(list, order) {
      for (var i = 0, len = list.length; i < len; i++) {
        if (list[i].ticket === order) {
          return true;
        }
      }
    }
  }

  _progress(symbol, priceInfo) {
    var orders = this.getOrderBySymbol(symbol);

    if (orders.length) {
      orders.forEach((order) => {
        var itemEl = $('.item-' + order.ticket);
        var up = order.cmd.indexOf('buy') !== -1;
        var count = Math.abs(order.stopLoss - order.takeProfit);
        var curPrice = up ? priceInfo.bidPrice : priceInfo.askPrice;
        var min = order.stopLoss - order.takeProfit > 0 ? order.takeProfit : order.stopLoss;

        var curCount = Math.abs(min - curPrice);


        var per = curCount / count;
        var per = up ? per : (1 - per);
        per = per >= 1 ? 99 : per * 100;
        $('.progress-inner', itemEl).width(per + '%');
      });
    }
  }

  getTotal(force) {
    var total = 0;

    if (this.props.currentOrderList.length === 0 && !force) {
      this.total = 0;

      $('.J_Toal').text((0).toFixed(2));

      return;
    }

    // 只计算这次下单的订单
    this.getHistoryOrderList().then((data) => {

      (data.list || []).forEach((item) => {
        if (item.ui == 6) {

          var i;

          (this.list || []).forEach((order, index) => {
            if (order.ticket == item.ticket) {
              i = index

              $('.item-' + order.ticket).remove();
            }
          });

          if (this.list && i !== undefined) {
            this.list.splice(i, 1);
            i = undefined
          }


          if (this.props.currentOrderList.indexOf(item.ticket) !== -1) {
            total += parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
          }
        }
      });

      this.total = total;

      $('.J_Toal').text((total).toFixed(2));
    });
  }


  getOrderBySymbol(symbol) {
    var orders = [];

    (this.props.accountData.list || []).forEach((order) => {
      order.symbol === symbol && orders.push(order);
    });

    return orders;
  }


  _setHeight() {
    var height = $(window).height();

    this.el.height(height);
  }

  _showLoad(curEl) {
    // curEl.attr('data-name', curEl.text());
    // curEl.html('<span>处理中<span class="dialog-load"></span></span>');
  }

  _getOption() {
    var token = this.cookie.get('token');

    if (!token) {
      this.el.html('<p class="empty">您还没有添加自选品种</p>');
    }

    var type = this.isDemo() ? 'demo' : 'real';
  }

  _fold(e) {
    var bodyEl = $('#J_Page'),
      htmlEl = $('html');

    $('.option-list').removeClass('show');
    if (bodyEl.hasClass('move-x')) {
      //htmlEl.removeClass('move-x');
      $('body').removeClass('unfold');


      bodyEl.removeClass('move-x');

      $('.J_OptionBannerMask').hide();
      bodyEl.css({
        height: 'auto',
        // overflow: 'auto'
      });

    } else {
      $('body').addClass('unfold');
      //htmlEl.addClass('move-x');

      // setTimeout(() => {
      bodyEl.addClass('move-x');

      bodyEl.css({
        height: $(window).height(),
        //  'overflow': 'hidden'
      });
      $('.J_OptionBannerMask').show()
      clearTimeout(this.intervalKey);
      //}, 150);
      try {
        var list = this.props.accountData.list.filter((order) => {
          return order.ui == 6 && order.symbol === this.props.symbol;
        });



        var total = 0; // 盈亏
        var symbols = [];

        if (!list.length) {
          this.render(tmpl, {
            order: [],
            float: 0,
            floatOption: {},
            total: this.total
          }, this.el);
          return;
        }


        if (list.length) {
          $.each(list, function(index, item) {
            total += parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
            // symbols.push(item.symbol);
            if (symbols.indexOf(item.symbol) === -1) {
              symbols.push(item.symbol)
            }
          });
        }

        this.getTotal();

        this.getFloatingProfit(this.props.bottomAccount.account, list, symbols).done((profit, floatOption) => {
          this.render(tmpl, {
            order: list,
            float: profit,
            floatOption: floatOption,
            total: this.total // + profit
          }, this.el);

          this._getCurPrice(this.props.accountData.list);

          this.list = list;
          // this.interval(this.list, symbols);
          this.interval(symbols);
        });

      } catch (e) {
        console.log(e);
      }

    }
  }

  interval(symbols) {
    this.intervalKey = setTimeout(() => {
      this.getFloatingProfit(this.props.bottomAccount.account, this.list, symbols).done((profit, floatOption) => {

        $('.J_Float', this.el).text(profit.toFixed(2));
        $.each(floatOption, function(ticket, profit) {
          $('.item-' + ticket + ' .float-p').text(profit.toFixed(2));
        });

        // $('.J_Toal', this.el).text((profit + this.total).toFixed(2));

        // $('.J_Toal', this.el).text()

        // this.interval(this.list, symbols);
        this.interval(symbols);

        // 随机调用，防止次数太多
        Math.random() < 0.05 && this.getTotal();
      });
    }, 2000);

  }

  defaults() {
    return {
      cacheSymbol: {}
    }
  }

  _preventTouch(e) {
    e.preventDefault();
  }
}
