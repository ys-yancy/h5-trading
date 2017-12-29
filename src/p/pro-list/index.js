"use strict";

var Base = require('../../app/base');
var Config = require('../../app/config');
var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var storage = require('../../app/storage');

var Cookie = require('../../lib/cookie');
var Big = require('../../lib/big');
var Dialog = require('../../common/dialog');
var Toast = require('../../common/toast');
var Chart = require('../../common/chart');
var Sticky = require('../../common/sticky');
var CandleRefresh = require('../../common/candle-refresh');
var MarqueeTitle = require('../../common/marquee-title');
var TimeChart = require('./compontent/chart/time');
var navTmpl = require('./tmpl/nav.ejs');
var infoTmpl = require('../pro-trading/tpl/info.ejs');
var orderListTmpl = require('./tmpl/orderList.ejs');

const Sound = require('../../common/sound');

function ProChart() {
  ProChart.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(() => {
    this.getAllSymbolsPrice().then(() => {
      if (self.cookie.get('goType')) {
        self.cookie.set('type', 'real');
      }
      self.init();
      new Sound();
    });
  });
}

Base.extend(ProChart, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._getOrderList();
    this._initChart();
    this._initSticky();
    this._getCurPrice();
    this._getSymbol();
    this.configStatistics();
  },

  mix: [CandleRefresh, MarqueeTitle],

  _bind: function() {
    var doc = $(document);

    doc.on('tap next:order', '.J_Item', $.proxy(this._switch, this));
    doc.on('tap', '.J_CloseOrder', $.proxy(this._closeOrder, this));
    doc.on('tap', '.J_RangeFn', $.proxy(this._showSelectRange, this));
    doc.on('tap', '.range-selector', $.proxy(this._selectRange, this));

    this.subscribe('reject:realToken', this._rejectRealToken, this);
    this.subscribe('get:realToken', this._getRealToken, this);

    doc.on('tap', $.proxy((e) => {
      let curEl = $(e.target),
        parentEl = curEl.parents('.bar-wrapper');
      
      if (curEl.hasClass('bar-wrapper') || parentEl.length > 0) {} else {
        this._hideSelectRange();
      }
    }, this))

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }
  },

  _getOrderList: function() {
    var self = this;
    this.getCurrentOrderList().then(function(list) {
        self._cacheData = list;
        // 只取开仓订单
        list = list.list;

        self.render(orderListTmpl, list, $('.J_List'));
        
        self._cacheList = self._cacheList || {};
        for (var i = 0, len = list.length; i < len; i++) {
            var item = list[i],
                ticket = item.ticket;

            self._cacheList[ticket] = item;
        }
    })
  },

  _switch: function(e) {
    var curEl = $(e.currentTarget);
    var ticket = curEl.attr('data-ticket');
    var order = this._cacheList[ticket];

    var profit = order.profit,
      price = this.priceInfo.bidPrice; // 画图用bidprice

    // if (order.cmd.indexOf('buy') === -1) {
    //     price = this.priceInfo.askPrice
    // } else {
    //     price = this.priceInfo.bidPrice
    // }

    var chart = this.chart;

    chart.updateProfitPlotLine(profit, price, ticket);
    
    this.orderObject = order;
    this.order = ticket;
    curEl.siblings().removeClass('active');
    curEl.addClass('active');
  },

  _closeOrder: function(e) {
    var self = this;
    var curEl = $(e.currentTarget);
    var ticket = curEl.attr('data-ticket');
    
    if (!this.isDemo()) {
        this.getRealToken().then(function(realToken, readLocal) {
            if (!readLocal) {
                return;
            }

            self._unwinding(realToken);
        });
    } else {
        this._unwinding(null,);
    }

  },

  _unwinding: function(realToken) {
    var self = this,
        order = this.order,
        slippage = this.orderObject.slippage,
        p;
    if (this.orderObject.cmd.toLowerCase().indexOf('buy') != -1) {
      p = this.bidPrice;
    } else {
      p = this.askPrice;
    }

    var data = {
        access_token: Cookie.get('token'),
        slippage: slippage,
        closeprice: p
    };

    /**
     * b)平仓时: 对于不同交易类型的订单, closeprice应该使用:
     *   i.买跌(SELL): closeprice = ask_price;
     *   ii.买涨(BUY): closeprice = bid_price;
     */

    if (realToken) {
      data.real_token = realToken;
    }

    this.ajax({
      url: '/v1/order/close/' + order,
      type: 'post',
      data: data
    }).then(function(data) {
        new Toast('平仓成功');
        self._removeOrderList(order)
    }, function(data) {
        console.log('失败')
    });
  },

  _removeOrderList: function(ticket) {
    var listEl = $('.J_List');

    try {
        var curOrderEl = $('.J_Item.active', listEl);
    } catch (e) {}

    if (curOrderEl.length <= 0) {
        this.order = '';
        this.orderObject = null;
        this._cacheList = {}; 
        return; 
    }

    curOrderEl.remove();
    delete this._cacheList[ticket];  

    var orderEls = $('.J_Item', listEl);

    if (orderEls.length > 0) {
        $(orderEls[0]).trigger('next:order',{
            currentTarget: orderEls[0]
        });
    } else {
        try {
            this.order = '';
            this.orderObject = null;
            this._cacheList = {};
            this.chartInstance = this.chart.getInstance();
            this.chartInstance.yAxis[0].removePlotLine('up');
            this.chartInstance.yAxis[0].removePlotLine('down');
        } catch (e) {}
    }
        
  },

  _rejectRealToken: function() {
    if (!this.isDemo()) {
      Cookie.set('type', 'demo');
      location.reload();
    }
  },

  _getRealToken: function() {
    Cookie.set('type', 'real');
    location.reload();
  },

  _showSelectRange: function() {
    var popupEl = $('#J_RangeList');

    popupEl.show();
    setTimeout(() => {
      popupEl.addClass('show');
    }, 0)
  },

  _hideSelectRange: function() {
    var popupEl = $('#J_RangeList');

    popupEl.removeClass('show');
    setTimeout(() => {
      popupEl.hide();
    }, 50);
  },

  _selectRange: function(e) {
    var curEl = $(e.currentTarget),
      parentEl = curEl.parents('.rangeSelector-wrapper'),
      curValEl = $('.J_CurRange', parentEl),
        index = curEl.index();

    var types = this.types;
    var type = types[index];

    this._getCandle(type, true);

    this.chartInstance && this.chartInstance.showLoading();
    curEl.addClass('active');
    curEl.siblings().removeClass('active');
    curValEl.text(curEl.text());
    this._hideSelectRange();
  },

  _getSymbol: function() {
    var self = this;
    var type = this.isDemo() ? 'demo' : 'real';

    this.getAccount().then(function(data) {
      self.account = data.account;

      self.ajax({
        url: '/v3/' + type + '/symbols6/',
        data: {
          symbols: self.symbol,
          access_token: Cookie.get('token')
        }
      }).then(function(data) {
        data = data.data[0];
        self.symbolValue = data;
        self.name = data.policy.name;
        this.unit = data.policy.min_quote_unit;
        self._checkSymbolStatus();
        self.setTitle(self.name);
      });
    })  
  },

  _checkSymbolStatus: function() {
    var self = this;
    var accountType = this.isDemo() ? 'demo' : 'real';
    this.checkStatus(this.symbolValue, this.account).then(function(data) {
      data.accountType = accountType;
      self.curState = '';
      if (data.type === 'close') {
        self.closeTime = Util.getTime(data.closeTime) - 60 * 60 * 24 * 1000;
        self._getData();
        self.curState = 'close';
      }
    })
  },

  _getNowDateFormate: function(now) {
    var date = now ? new Date(now) : new Date(Date.now() - 60 * 60 * 24 * 1000);
    var displayTime = date.Format("yyyy-MM-dd HH:mm:ss").substring(0, 10);

    return displayTime;
  },

  _getCurPrice: function(interval) {
    var self = this,
      type = this.isDemo() ? 'demo' : 'real';

    return this.getCurrentPrice(this.symbol, true).then((priceInfo) => {

      if (!priceInfo.ask_price || !priceInfo.bid_price) {
        self.openPrice = '--';

        return;
      }
      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      if (self.hasStatus()) {
        self.shouldChartUpdate(priceInfo);
      }

      if (self._getCacheCurPrice()) {
        return self.cacheCurPrice;
      }

      return self._getData(interval);
    });
  },

  _getCacheCurPrice: function() {
    return this.cacheCurPrice;
  },

  _setCacheCurPrice: function(price) {
    var self = this;
    clearTimeout(this.cachePriceTimer);

    this.cacheCurPrice = price;

    this.cachePriceTimer = setTimeout(function() {
      self.cacheCurPrice = null;
    }, self.getCandleExpireTime());
  },

  _getData: function(interval) {
    var self = this,
      symbol = this.symbol,
      date = this._getNowDateFormate(self.closeTime);

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

        // 定时刷新逻辑
        if (interval) {
          self._setCacheCurPrice(price);

          return price;
        }

        price.close = yesterdayPrice.close;

        var up = price.price - price.close > 0 ? true : false;


        self.priceInfo = price;


        self.render(infoTmpl, price, infoEl);
        up ? infoEl.addClass('up') : infoEl.removeClass('up');

        self._setInterval();
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
  },

  _setInterval: function() {
    var self = this;

    this._getCurPrice(true).then(function(curPriceInfo) {

      // 绘图用bidPrice
      var up = self.price - self.priceInfo.close > 0 ? true : false;
      var infoEl = $('#J_Info');

      // 把bidPrice和askPrice传给info条
      curPriceInfo.bidPrice = self.bidPrice;
      curPriceInfo.askPrice = self.askPrice;
      curPriceInfo.price = self.price;
      try {
        curPriceInfo.floatCount = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        curPriceInfo.floatCount = 0;
      }
      curPriceInfo.close = self.priceInfo.close;

      self.render(infoTmpl, curPriceInfo, infoEl);
      up ? infoEl.addClass('up') : infoEl.removeClass('up');

      // self.priceInfo = parseFloat(curPriceInfo);
      self.priceInfo = curPriceInfo;

      if (self.chart) {
        // console.log(self.bidPrice, self.price);
        // 绘图用bidPrice
        // self.chart && self.chart.updatePlotLine(self.bidPrice, up);
        self._updateChartProfitPlotLine(self.bidPrice, up);

        var lastData = self.lastData;

        // 绘图使用bidPrice
        var curPrice = parseFloat(self.bidPrice);

        // time open high low close

        lastData[0] = Date.now();
        lastData[2] = lastData[2] < curPrice ? curPrice : lastData[2];
        lastData[3] = lastData[3] > curPrice ? curPrice : lastData[3];
        lastData[4] = curPrice;

        if (self.hasStatus()) {
          var data = self.chart.addPoint(lastData);

          // 之后有需要再打开 更新timeChart
          self.broadcast('update:chart', curPriceInfo);
          if (data) {
            self.lastData = data;
          }
        }

      }

      if (self.curState === 'close' && self.refresh) {
        return;
      }
      self.refresh = true;

      setTimeout(function() {
        self._setInterval();
      }, self.getIntervalTime());
    });
  },

  _updateChartProfitPlotLine: function(bidPrice, up) {
    var self = this;
  
    try{ 
      var order = this.order,
        orders = this._cacheData.list,
        symbols = this._cacheData.symbols,
        swap = 0,
        commission = 0;
      
      if (self.orderObject) {
        swap = parseFloat(self.orderObject.swap) || 0;
        commission = parseFloat(this.orderObject.commission);
      }

      this.getFloatingProfit(self.account, orders, symbols).then(function(floatProfit, profitOption) {
        $('li.item', '.J_List').each(function(index, item){
          item = $(item);
          var profitEl = $('.J_Profit', item);
          var ticket = item.attr('data-ticket');
          profitEl.text(profitOption[ticket].toFixed(2));
          if (profitOption[ticket] > 0) {
            item.removeClass('down').addClass('up');
          } else {
            item.removeClass('up').addClass('down');
          }
        });

        if (order && self.orderObject) {
          floatProfit = (profitOption[order] + commission - swap)
          floatProfit = floatProfit.toFixed(2);
          self.chart && self.chart.updateProfitPlotLine(floatProfit, bidPrice, order);
        } else {
          self.chart && self.chart.updatePlotLine(bidPrice, up);
         }

      });

    } catch(e) {
      self.chart && self.chart.updatePlotLine(bidPrice, up);
    }
  },

  _getCandle: function(type, refresh) {
    var self = this;

    if (type) {
      this.candleType = type;
    } else {
      type = this.candleType;
    }

    var map = {
      m1: 60,
      m5: 5 * 60,
      m15: 15 * 60,
      m30: 30 * 60,
      h1: 60 * 60,
      d1: 24 * 60 * 60
    };

    var indexMap = {
      m1: 0,
      m5: 1,
      m15: 2,
      m30: 3,
      h1: 4,
      d1: 5
    };

    this.ajax({
      url: this.candleUrl,
      dateType: 'jsonp',
      data: {
        id: this.symbol,
        //start_time: Util.formateTime((this.startTime || Date.now()) - (map[type] * 1000 * 50), "yyyy-MM-dd HH:mm:ss"),
        tf: type,
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true,
    }).then(function(data) {
      data = data.data;

      var list = [];
      for (var i = data.price.length - 1, count = 0; i > 0; i--) {
        var item = data.price[i];
        ++count;
        list.push([
          Util.getTime(item.beijing_time),
          item.open,
          item.high,
          item.low,
          item.close
        ]);

        if (count > 50) {
          break;
        }
      }
      list = list.sort(function(a, b) {
        return a[0] > b[0] ? 1 : -1;
      });



      self.chartData = list;
      self.lastData = list[list.length - 1];


      if (self.chart) {
        try {
          var chart = self.chartInstance;

          chart.series[0].setData(list);
          chart.hideLoading();
          self.chart.selectedIndex = indexMap[type];
          self.broadcast('update:chart:seriess', {
            list: list,
            selectedIndex: indexMap[type]
          });
          if (refresh && self.curState == 'close') {
            self.refresh = false;
            self._getData();
          }
        } catch (e) {}

        return;
      }

      self._hideLoading();
      // create the chart
      self.chart = new Chart({
        data: list,
        price: self.price,
        up: false,
        stockName: self.name,
        selectedIndex: self.types.indexOf(type),
        height: '110%',
        xLabelShow: false
      });
      self.type = 'up';
      self.chartInstance = self.chart.getInstance();
      self._initTimeChart(list, self.price, self.types.indexOf(type));
    });
  },

  hasStatus: function() {
    return this.curState !== undefined && this.curState !== 'close'
  },

  _initChart: function() {
    var self = this;

    this._getCandle('m30');
  },

  _initTimeChart: function(list, price, selectedIndex) {
    this.timeChart = new TimeChart({ 
      parent: this, 
      list: list,
      price: price,
      selectedIndex: selectedIndex,
      symbol: this.symbol, 
      unit: this.unitQuote || 2
    });
  },

  _hideLoading: function() {
    $('#J_Loading').remove();
    $('#J_RangeContro').show();
  },

  _initSticky: function() {
    var stickyEl =$('#J_Sticky');
    var isRapid = Cookie.get('tradingUI') == 6;
    var chartUrl = isRapid ? './rapid.html' : 'pro-trading.html';
    this.render(navTmpl, {
      search: window.location.search,
      source: window.location.pathname,
      chartUrl: chartUrl
    }, stickyEl)
    stickyEl.sticky();
  },

  _initAttrs: function() {
    var params = new Uri().getParams();
    this.symbol = params.symbol;
    this.name = params.name;
    if (this.name) {
      this.setTitle(this.name);
    }
  },

  attrs: {
    types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
  }
});

new ProChart();