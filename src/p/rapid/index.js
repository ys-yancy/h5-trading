'use strict';

var Base = require('../../app/page-base');
var Uri = require('../../app/uri');
var BottomAccount = require('../../common/bottom-account/data');
var Sticky = require('../../common/sticky');
var Cookie = require('../../lib/cookie');
var Chart = require('./component/chart');
var Order = require('./component/order');
var Progress = require('./component/progress/new');
var Check = require('../../common/check');
var navTmpl = require('./nav.ejs');
var infoTmpl = require('../pro-trading/tpl/info.ejs');

var Attribute = require('../pro-trading/attribute');

class Rapid extends Base {
  constructor() {
    super();
    this.configStatistics();
    this._initSticky();
    // this._response();
    this.login().then(() => {
      this.bottomAccount = new BottomAccount({
        filterUI: 6,
        filterList: this.currentOrderList,
        props: this
      });
      this.query = new Uri().getParams();
      this.symbol = this.query.symbol;
      $('#J_Title').text(this.query.name);

      if (this.isDemo()) {
        $('.footer .tag').text('模拟');
      }
      else {
        $('.footer .tag').text('实盘');
      }

      new Check();
      var unit;
      var query = this.query;
      try {
        unit = query.unit.split('.')[1].length;
      } catch (e) {
        unit = 2;
      }
      this.unitQuote = unit;
      this.getSymbolValue().then((data) => {
        this._bind();
        this.order = new Order({
          props: this,
          bottomAccount: this.bottomAccount
        });
        this.chart = new Chart({
          el: $('#J_ChartWrapper'),
          parent: this,
          symbol: this.query.symbol,
          unit: this.unitQuote,
          bidPrice: this.bidPrice,
          up: true
        });
        this._getData();
      });
    });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('rapid');
    }
  }

  _bind() {
    $(document).on('tap', '.attribute-trigger', $.proxy(this._showAttribtue, this));

    this.subscribe('account:did:update', (e) => {
      $('.J_NetDeposit').text(e.netDeposit.toFixed(2) + '' || '--');

      if (!this.accountData) {
        this.progress = new Progress({ freeMargin: e.freeMargin, netDeposit: e.netDeposit });

        var leverage = this._getLeverage(this.symbolValue, e);
        var data = $.extend({}, this.symbolValue, true);
        data.leverage = leverage;
     
        this.attribute = new Attribute(data);
      }
      this.accountData = e;

      $('.J_Float').text(e.profit.toFixed(2) || 0);

      parseFloat($('.J_Float').text()) > 0 ? $('.J_Float').addClass('up') : $('.J_Float').removeClass('up');
      $('.J_Count').text(e.list.length);

      var total = 0; // 盈亏

      if (e.list.length) {
        $.each(e.list, function(index, item) {
          total += parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
        });
      }

      this.accountData.total = total;

    });

    this.subscribe('stomp:price:update', (e) => {
      if (this.query.symbol === e.symbol) {
        // 暂时去掉之后需要再打开
        this.broadcast('update:chart', e);
        this.priceInfo = e;
        this.askPrice = e.askPrice;
        this.bidPrice = e.bidPrice;

        $('#J_CurPrice').text(this.bidPrice);

        this.chart && this.chart.updatePlotLine(this.bidPrice, this.bidPrice - this.closePrice);
      }
    }, this);
  }

  getSymbolValue() {
    var type = this.isDemo() ? 'demo' : 'real';

    return this.ajax({
      url: '/v3/' + type + '/symbols6/',
      data: {
        symbols: this.query.symbol,
        access_token: this.cookie.get('token')
      }
    }).then((data) => {
      data = data.data[0];
      this.symbolValue = data;
      this.unit = data.policy.min_quote_unit;

      this.askPrice = data.quote.ask_price[0];
      this.bidPrice = data.quote.bid_price[0];
      this.closePrice = data.close_price;

      this.name = data.policy.name;

      this.defaultTakeprofit = data.policy.default_takeprofit;
    });
  }

  _getData(interval) {
    var self = this,
      symbol = this.symbol;

    return this.ajax({
      url: this.candleUrl,
      data: {
        id: symbol,
        tf: 'd1',
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true
    }).then(function(data) {
      data = data.data;

      var priceData = data.price.slice(data.price.length - 2);

      var price = priceData[1];
      var yesterdayPrice = priceData[0];
      var unit;

      try {
        unit = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        unit = self.unit;
      }

      var infoEl = $('#J_Info');
      if (price) {
        price.price = self.bidPrice;
        price.unit = unit;

        price.close = yesterdayPrice.close;

        var up = price.price - price.close > 0 ? true : false;

        self.priceInfo = price;

        self.render(infoTmpl, price, infoEl);
        up ? infoEl.addClass('up') : infoEl.removeClass('up');

        // self._setInterval();
      }

      // 当天无价格
      if (!price && yesterdayPrice) {
        var up = true; // 默认上涨
        self.render(infoTmpl, {
          close: yesterdayPrice.close,
          up: true
        }, infoEl);

        up ? infoEl.addClass('up') : infoEl.removeClass('up');
      }
    });
  }

  _getLeverage(symbol, account) {
    var max_leverage = this.isDemo() ? symbol.policy.demo_max_leverage : symbol.policy.real_max_leverage;
    var trading_leverage = account.leverage * symbol.policy.leverage_multiplier;
    max_leverage = parseFloat(max_leverage);
    trading_leverage = parseFloat(trading_leverage);

    trading_leverage = trading_leverage < max_leverage ? trading_leverage : max_leverage;

    return trading_leverage;
  }

  _showAttribtue(e) {
    if (this.attribute) {
      this.attribute.show();
    }
  }

  _initSticky(search) {
    var stickyEl =$('#J_Sticky');
    this.render(navTmpl, window.location.search, stickyEl)
    stickyEl.sticky();
  }

  _response() {
    var contentEl = $('.content');
    var winHeight = $(window).height();
    var headerHeight = $('header').height();
    var footerHeight = $('footer').height();
    var charHeight = $('#J_ChartWrapper').height();
    var accountHeight = $('.account-wrapper').height();
    var orderHeight = $('.order-wrapper').height();
    var fixHeight = $('.fix').height();

    if (winHeight - headerHeight - footerHeight - charHeight - accountHeight - orderHeight - fixHeight > 0) {
      $('body').css({ overflow: 'hidden' })
    }
  }

  defaults() {
    return {
      prevIndex: 0,
      currentOrderList: []
    };
  }
}

new Rapid();
