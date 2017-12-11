"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');

var Chart = require('../../common/chart/index');
var Sticky = require('../../common/sticky');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Config = require('../../app/config');
var CandleRefresh = require('../../common/candle-refresh');
var MarqueeTitle = require('../../common/marquee-title');
var infoTmpl = require('./info.ejs');
var orderTmpl = require('./order.ejs');
var LiveSpeech = require('../../common/live-speech');
var Share = require('../pro-trading/share');


function OrderHistory() {
  OrderHistory.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(function() {
    self.init();
  });
}

Base.extend(OrderHistory, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._initChart();
    this._initSticky();
    this._getData();
    this._getOrder();
    this._checkStatus();
    this.configStatistics();

    new LiveSpeech();
  },

  mix: [CandleRefresh, MarqueeTitle],

  _bind: function() {
    var doc = $(document);

    doc.on('tap', '.J_Unfold', $.proxy(this._unfold, this));
    doc.on('tap', '.range-selector', $.proxy(this._selectRange, this));
    
    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

  },

  _unfold: function(e) {
    var curEl = $(e.currentTarget);

    if (curEl.hasClass('unfold')) {
      curEl.removeClass('unfold');
      this.containerEl.removeClass('unfold');
      //this.chartContainerEl.show();
    } else {
      curEl.addClass('unfold');
      this.containerEl.addClass('unfold');
      //this.chartContainerEl.hide();
    }
  },

  _selectRange: function(e) {
    var curEl = $(e.currentTarget),
      index = curEl.index(),
      buttonEls = document.getElementsByClassName('highcharts-button'),
      buttonEl = $(buttonEls[index]);

    var types = ['m1', 'm5', 'm15', 'm30', 'h1', 'd1'];
    var type = types[index];
    this._getCandle(type);


    this.chartInstance.showLoading();
    // buttonEl.trigger('click');
    // if (this.chart && this.chart.instance.rangeSelector.selected === index) {
    curEl.addClass('active');
    curEl.siblings().removeClass('active');
    // }

  },

  _initAttrs: function() {
    var doc = $(document);
    var params = new Uri().getParams();

    this.name = params.name;
    this.symbol = params.symbol;
    this.price = parseFloat(params.price);
    this.order = params.order;
    this.unit = params.unit ? params.unit : params.price;


    this.setTitle(this.name);

    // 是否绘制开仓平仓价格线
    this.drawPriceLines = false;
  },

  _shareOrder: function() {

    // 显示隐藏的图片
    $('#J_InfoImg').css('display', 'block');
    new Share({ ticket: this.order, type: 'order' });
  },

  _checkStatus: function() {
    var self = this,
      type,
      data = {};

    if (!this.isDemo()) {
      data.access_token = Cookie.get('token');
      type = 'real';
    } else {
      type = 'demo';
    }

    self.getAccount().then(function(account) {
      self.account = account.account;

      return self.ajax({
        url: '/v3/' + type + '/symbols6/',
        data: {
          symbols: self.symbol,
          access_token: Cookie.get('token')
        }
      });
    }).then(function(data) {

      var symbolValue = data.data[0];
      self.unit = symbolValue.policy.min_quote_unit;

      try {
        self.minUnit = symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
      } catch (e) {
        self.minUnit = symbolValue.policy.min_quote_unit;
      }

      self.checkStatus(symbolValue, self.account).then(function(data) {
        self.curState = '';
        // 如果是休市 无需刷新价格
        if (data.type === 'close') {
          self.closeTime = Util.getTime(data.closeTime) - 60 * 60 * 24 * 1000;
          self._getData();
          self.curState = 'close';
        }
      });

    });
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
          //start_time: date
      },
      unjoin: true
    }).then(function(data) {
      data = data.data;
      var priceData = data.price.slice(data.price.length - 2);

      var price = priceData[1];
      var yesterdayPrice = priceData[0];
      var unit
      try {
        var unit = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        unit = self.unit;
      }
      var infoEl = $('#J_Info');

      if (price) {
        // 对于开仓订单要选择性显示bid或者ask
        if (self.orderObject) {
          if (self.orderObject.cmd.indexOf('buy') != -1) {
            price.price = self.bidPrice;
          } else {
            price.price = self.askPrice;
          }
        } else {
          price.price = self.price;
        }
        price.unit = unit;

        // 定时刷新逻辑
        if (interval) {
          self._setCacheCurPrice(price);
          return price;
        }

        price.close = yesterdayPrice.close;

        var up = price.price - price.close > 0 ? true : false;

        self.priceInfo = price;
        // curPriceInfo.usePrice = up ? curPriceInfo.askPrice : curPriceInfo.bidPrice;
        // console.log(price);
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

  // _getData: function() {
  //     var self = this,
  //         symbol = this.symbol,
  //         date = this._getNowDateFormate(self.closeTime);

  //     this.ajax({
  //         url: 'http://price.invhero.com/v1/price/candle?',
  //         data: {
  //             id: symbol,
  //             tf: 'd1',
  //             start_time: date
  //         },
  //         unjoin: true
  //     }).then(function(data) {
  //         data = data.data;
  //         try {
  //             var price = data.price[0];
  //             price.price = self.price;
  //             self.render(infoTmpl, price, $('#J_Info'));
  //         } catch (e) {}
  //     });
  // },

  // 实时刷新价格
  _getCurPrice: function(interval) {
    var self = this,
      router = this.router,
      type = this.isDemo() ? 'demo' : 'real';

    return this.getCurrentPrice(this.symbol, true).then(function(priceInfo) {
      self.price = priceInfo.price;

      if (!priceInfo.bid_price || !priceInfo.ask_price) {
        self.openPrice = '--';
        return;
      }

      if (self.hasStatus()) {
        priceInfo && self.shouldChartUpdate(priceInfo);
      }


      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      if (!self.account) {
        return;
      }

      if (self._getCacheCurPrice()) {
        return self.cacheCurPrice;
      }


      return self._getData(interval);
    });
  },

  hasStatus: function() {
    return this.curState !== undefined && this.curState !== 'close';
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

  _setInterval: function() {
    var self = this;

    this._getCurPrice(true).then(function(curPriceInfo) {

      if (self.chart && self.orderObject && !self.drawPriceLines) {
        self.drawPriceLines = true;
        self.chart.addPlotLine(self.orderObject.openPrice, 'open');
        if (self.orderObject.status === 'closed') {
          self.chart.addPlotLine(self.orderObject.closePrice, 'close');
        }
      }

      if (!curPriceInfo) {
        setTimeout(function() {
          self._setInterval();
        }, self.getIntervalTime());
        return;
      }

      var up = curPriceInfo.price - self.priceInfo.close > 0 ? true : false;
      var infoEl = $('#J_Info');
      // var openPriceInputEl = $('#J_OpenPriceInput');
      // var openPrice = curPriceInfo.bid_price + curPriceInfo.ask_price
      curPriceInfo.bidPrice = self.bidPrice;
      curPriceInfo.askPrice = self.askPrice;
      curPriceInfo.price = self.price;

      try {
        curPriceInfo.floatCount = self.unit ? self.unit.split('.')[1].length : 2;
      } catch (e) {
        curPriceInfo.floatCount = self.unit;
      }

      curPriceInfo.close = self.priceInfo.close;

      if (self.orderObject) {
        if (self.orderObject.cmd.indexOf('buy') != -1) {
          curPriceInfo.price = self.bidPrice;
        } else {
          curPriceInfo.price = self.askPrice;
        }
      }

      curPriceInfo.usePrice = curPriceInfo.price;

      // curPriceInfo.usePrice = up ? curPriceInfo.askPrice : curPriceInfo.bidPrice;

      self.render(infoTmpl, curPriceInfo, infoEl);
      up ? infoEl.addClass('up') : infoEl.removeClass('up');

      self.priceInfo = curPriceInfo;
      /*
      if (!self.open) {
          openPriceInputEl.val(self.openPrice);
          self._priceValidate({
              currentTarget: openPriceInputEl
          });
      }
      */
      self.chart.updatePlotLine(curPriceInfo.usePrice, up);

      var lastData = self.lastData;
      var curPrice = parseFloat(curPriceInfo.usePrice);

      // time open high low close

      lastData[0] = Date.now();
      lastData[2] = lastData[2] < curPrice ? curPrice : lastData[2];
      lastData[3] = lastData[3] > curPrice ? curPrice : lastData[3];
      lastData[4] = curPrice;

      if (self.hasStatus()) {
        // self.chart.addPoint(lastData);
        var data = self.chart.addPoint(lastData);

        if (data) {
          self.lastData = data;
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

  _getNowDateFormate: function(now) {
    var date = now ? new Date(now) : new Date(Date.now() - 60 * 60 * 24 * 1000);
    var displayTime = date.Format("yyyy-MM-dd HH:mm:ss").substring(0, 10);

    return displayTime;
  },

  _initSticky: function() {
    // 导致浏览器crash
    $('#J_Sticky').sticky();
  },

  _getOrder: function() {
    var self = this;
    var data = {
      order: this.order
    };

    data.access_token = this.cookie.get('token');
    if (!this.isDemo()) {
      this.getRealToken().then(function(realToken) {
        data.real_token = realToken;
        self._requestOrder(data);
      });
    } else {
      this._requestOrder(data);
    }
  },

  _requestOrder: function(data) {
    var self = this;

    this.ajax({
      url: '/v1/order/' + this.order,
      data: data
    }).then(function(data) {
      console.log(data);
      self.orderObject = data.data;

      switch (data.data.closeType) {
        case 'order':
          data.data.closeType = '手动平仓';
          break;
        case 'takeprofit':
          data.data.closeType = '止盈平仓';
          break;
        case 'stoploss':
          data.data.closeType = '止损平仓';
          break;
        case 'margin_check':
          data.data.closeType = '强制平仓';
          break;
        default:
          data.data.closeType = '--';
          break;
      }


      var doc = $(document);

      var myshow = !self.isDemo() && getUseNewShare();

      var desc = '分享交易';

      // 获取到订单信息和Nickname之后调用

      self.getAccount().then(function(account) {
        if (! self.profileObject) {
          self.profileObject = new Object ();
        }
        self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
        self.profileObject.nickname = account.nickname;

        if (self.isWeixin()) {
          var share;

          if (myshow) {
            desc = '分享订单';

            share = new Share({ ticket: self.order, type: 'order' });
          }

          var html = '<span class="option share">分享订单</span>';
          $('#J_Header').append(html);

          $('#J_Header .share').on('click', function() {
            // 显示隐藏的图片
            $('#J_InfoImg').css('display', 'block');
            // myshow && new Share({ ticket: self.order, type: 'order' });
            share && share.getInfo();
          });
          $('#J_InfoImg').on('click', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
          }, this));

          self.setupWeiXinShare('history');
          
        } else if (Config.isAndroidAPK()) {

          var avatar = self.profileObject.avatar;
          if (avatar && avatar.indexOf('http') == -1) {
            avatar = "http:" + avatar;
          }
          var nick = self.profileObject.nickname;
          
          var allProfit = parseFloat(self.orderObject.profit) + parseFloat(self.orderObject.swap) - parseFloat(self.orderObject.commission);
          var title = (nick || '我') + ' 买' + (self.orderObject.cmd.indexOf('buy') != -1 ? '涨' : '跌') + self.orderObject.symbolName + ', ' + (allProfit >= 0 ? '赚' : '亏') + '了' + parseFloat(allProfit).toFixed(2) + '美元, 收益率' + (allProfit / self.orderObject.margin * 100).toFixed(2) + '%'; // 分享标题;
          var desc = getWXHistoricalDesWL(); //'点击查看详情'; 
          var imgUrl = avatar || getWXIconWL(); // Config.getAndroidSharePrefix() + '/img/share.jpg';
          var wl = Cookie.get('wl'),wl_url = '/s/order-share.html?order=';
          if ( wl != 'tzyh365' ) {
              wl_url = '/' + wl + '/s/order-share.html?order=';
          }

          var link = Config.getAndroidSharePrefix() + wl_url + self.orderObject.ticket + '&symbol=' + self.orderObject.symbol + '&name=' + self.orderObject.symbolName + '&invite=' + Cookie.get('inviteCode') + '&nickname=我&cmd=' + self.orderObject.cmd; // 分享链接

          var l = 'invhero-android:shareOrder?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

          // 添加分享按钮
          var html = '<a class="option share" href=' + l + '>分享订单</a>';
          $('#J_Header').append(html);

          $('#J_Header .share').on('click', function() {
            var share;
            if (myshow) {
              share = new Share({ ticket: self.order, type: 'order' });
              share && share.getInfo();
            }
          });
        }
      });

      // 把swap和commission算到profit里
      data.data.allProfit = parseFloat(data.data.profit) + parseFloat(data.data.swap || 0) - parseFloat(data.data.commission || 0);

      self.render(orderTmpl, data.data, $('#J_Container'));
      if(data.data.closeType === '强制平仓'){
        $('#J_Info').before('<div class="margin_checkItem">该订单被强制平仓，由于交易过程中您账户保证金比例低于100%</div>'); 
      }
    });
  },

  _getCloseTime: function() {
    var self = this;
    this.ajax({
      url: '/v1/symbols/closetime/',
      data: {
        symbols: this.symbol
      }
    }).then(function(data) {
      if (data && data.data) {
        data = data.data;
        var symbol = data[self.symbol];
        if (symbol.length != 0)
          self.startTime = Util.getTime(symbol[0].start);
      }
    });
  },

  _getCandle: function(type) {
    var self = this;

    if (type) {
      this.candleType = type;
    } else {
      type = this.candleType;
    }

    // 获取休市时间
    if (!this.startTime) {
      this._getCloseTime();
    }

    var indexMap = {
      m1: 0,
      m5: 1,
      m15: 2,
      m30: 3,
      h1: 4,
      d1: 5
    };


    var map = {
      m1: 60,
      m5: 5 * 60,
      m15: 15 * 60,
      m30: 30 * 60,
      h1: 60 * 60,
      d1: 24 * 60 * 60
    };

    this.ajax({
      url: this.candleUrl,
      dateType: 'jsonp',
      data: {
        id: this.symbol,
        //start_time: (this.startTime || Date.now()) - (map[type] * 1000 * 50),
        tf: type,
        group_name: Cookie.get('type') == 'real' ? Cookie.get('real_group') : Cookie.get('demo_group')
      },
      unjoin: true,
    }).then(function(data) {
      //x,open,high,low,close

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

        if (count > 40) {
          break;
        }
      }
      list = list.sort(function(a, b) {
        return a[0] > b[0] ? 1 : -1;
      });
      self.lastData = list[list.length - 1];
      // $.each(data.price, function(index, item) {
      //     list.push([
      //         new Date(item.beijing_time).getTime(),
      //         item.open,
      //         item.high,
      //         item.low,
      //         item.close
      //     ]);
      // });

      // console.log(list)

      if (self.chart) {
        var chart = self.chartInstance;


        // chart.series

        chart.series[0].setData(list);

        chart.hideLoading();
        self.chart.selectedIndex = indexMap[type];

        return;
      }

      // create the chart
      self.chart = new Chart({
        data: list,
        price: self.price,
        up: false,
        stockName: self.name
      });
      self.type = 'up';
      self.chartInstance = self.chart.getInstance();
    });
  },

  _initChart: function() {
    var self = this;

    this._getCandle('m30');

    // setInterval(function() {
    //     self.chartInstance.series[0].addPoint()
    // }, 1000);

    //$.getJSON('http://www.hcharts.cn/datas/jsonp.php?filename=new-intraday.json&callback=?', function(data) {


    //create the chart
    // self.chart = new Chart({
    //     data: data,
    //     upPrice: '422.33123',
    //     downPrice: '419.79123'
    // });
    //});
  },

  attrs: {
    containerEl: $('#J_Container'),
    chartContainerEl: $('#J_ChartWrapper'),
    types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
  }
});

new OrderHistory();