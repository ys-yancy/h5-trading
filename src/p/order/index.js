"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Chart = require('../../common/chart/index');
var Dialog = require('../../common/dialog');
var Sticky = require('../../common/sticky');
var Toast = require('../../common/toast');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Cookie = require('../../lib/cookie');
var Config = require('../../app/config');
var CandleRefresh = require('../../common/candle-refresh');
var MarqueeTitle = require('../../common/marquee-title');
var Check = require('../../common/check');
const Sound = require('../../common/sound');
var Popup = require('./popup/index');
var infoTmpl = require('./tpl/info.ejs');
var orderTmpl = require('./tpl/order.ejs');
var actionTmpl = require('./tpl/action.ejs');
var closeTmpl = require('./tpl/close.ejs');

// var TopMsg = require('../../common/top-msg');
// var Share = require('../pro-trading/share');
// var LiveSpeech = require('../../common/live-speech');


function Order() {
  Order.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(() => {

    return this.getAllSymbolsPrice().then(() => {
      self.init();

      new Check();
      new Sound();

      // new TopMsg($.merge({
      //   el: $('.top-message'),
      //   className: 'special',
      // }, Config.getBroadcastConfig('order')));

    });
  });
}

Base.extend(Order, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._getPrice();
    this._receiveCloseTime();
    this._initSticky();
    this._getOrder();
    this.configStatistics();
    // new LiveSpeech();
  },

  mix: [CandleRefresh, MarqueeTitle],

  _bind: function() {
    var doc = $(document);
    this.on('receive:closeTime', this._receiveCloseTime, this);

    doc.on('tap', '.action', $.proxy(this._action, this));
    doc.on('tap', '.J_RangeFn', $.proxy(this._showSelectRange, this));
    doc.on('tap', '.range-selector', $.proxy(this._selectRange, this));

    // doc.on('tap', '.J_Unfold', $.proxy(this._unfold, this));

  },

  _receiveCloseTime: function(e) {
    var closeTime = this.startTime;

    this._getData();

    this._initChart();
  },

  // _unfold: function(e) {
  //   var curEl = $(e.currentTarget);
  //   if (curEl.hasClass('unfold')) {
  //     curEl.removeClass('unfold');
  //     this.containerEl.removeClass('unfold');
  //   } else {
  //     curEl.addClass('unfold');
  //     this.containerEl.addClass('unfold');

  //     setTimeout(() => {
  //       var height = this.containerEl.offset().top + this.containerEl.height() - $(window).height() + $('#footer').height() + 10;
  //       window.scrollTo(0, height);
  //     }, 300);
  //   }
  // },

  _showSelectRange: function() {
    var popupEl = $('#J_RangeList');

    popupEl.show();
    setTimeout(() => {
      popupEl.addClass('show');
    }, 0)
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

  _action: function(e) {
    var self = this,
      curEl = $(e.currentTarget);

    if (curEl.hasClass('close')) {
      e.preventDefault();

      // 挂单模式
      if (curEl.hasClass('guadan')) {
        this.guadanDialog = new Dialog({
          isShow: true,
          tmpl: this.delTmpl,
          confirmCallback: $.proxy(this._removeOrder, this)
        });

        return;
      }

      if (!this.isDemo()) {
        this.getRealToken().then(function(realToken, readLocal) {
          if (!readLocal) {
            return;
          }

          self._unwinding(realToken);
        });
      } else {
        this._unwinding(null);
      }
    }
  },

  _removeOrder: function() {
    var self = this;

    if (!this.isDemo()) {
      this.getRealToken().then(function(realToken) {
        self._removeGuadan(realToken);
      });
    } else {
      this._removeGuadan();
    }
  },

  // 删除挂单
  _removeGuadan: function(realToken) {
    var self = this,
      data = {
        access_token: Cookie.get('token')
      };

    if (realToken) {
      data.real_token = realToken
    }

    var curEl = $('.action.close');
    this._showLoad(curEl);

    this.ajax({
      url: '/v1/order/' + this.order,
      type: 'delete',
      data: data
    }).then(function(data) {
      new Toast('删除挂单成功！');
      self.guadanDialog.hide();
      setTimeout(function() {
        location.href = './trade-history.html';
      }, self.getIntervalTime());
      curEl.html('删除挂单');
    }, function(data) {
      new Toast(data.message);
      curEl.html('删除挂单');
    });
  },

  _unwinding: function(realToken) {

    var p;
    if (this.cmd.toLowerCase().indexOf('buy') != -1) {
      p = this.bidPrice;
    } else {
      p = this.askPrice;
    }



    var self = this,
      data = {
        access_token: Cookie.get('token'),
        slippage: this.slippage,
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

    var curEl = $('.action.close');
    this._showLoad(curEl);

    this.ajax({
      url: '/v1/order/close/' + this.order,
      type: 'post',
      data: data
    }).then(function(data) {
      new Popup({
        name: self.name,
        profit: data.data.profit,
        price: data.data.closePrice
      });


      // 更新订单数据
      self.orderObject.profit = data.data.profit;

      var btnDesc = '分享';
      var myshow = !self.isDemo() && !data.guadan && getUseNewShare();

      // if (myshow) {
      //   btnDesc = '分享订单到朋友圈 100% 赢实盘资金';
      // }

      if (self.isWeixin()) {
        var doc = $(document);
        var share;

        // if (myshow) {
        //   share = new Share({ ticket: self.order, type: 'order' });
        // }

        $('#J_Success').append('<a class="dialog-btn share J_Share" href="javascript:">' + btnDesc + '</a>');

        doc.on('click', '#J_Success .J_Share', $.proxy(function() {
          $('#J_InfoImg').css('display', 'block');
          // share && share.getInfo();
        }, this));

        doc.on('tap', '#J_InfoImg', $.proxy(function() {
          $('#J_InfoImg').css('display', 'none');
        }, this));

        self.setupWeiXinShare('history');
      } else if (Config.isAndroidAPK()) {
        var allProfit = parseFloat(self.orderObject.profit) + parseFloat(self.orderObject.swap) - parseFloat(self.orderObject.commission);
        var title = '我买' + (self.orderObject.cmd.indexOf('buy') != -1 ? '涨' : '跌') + self.orderObject.symbolName + ', ' + (self.orderObject.profit >= 0 ? '赚' : '亏') + '了' + allProfit.toFixed(2) + '美元, 收益率' + (allProfit / self.orderObject.margin * 100).toFixed(2) + '%'; // 分享标题;
        var desc = getWXCurrentDesWL(); // '点击查看详情' ;
        var imgUrl = getWXIconWL(); //Config.getAndroidSharePrefix() + '/img/share.jpg';

        var wl = Cookie.get('wl'),wl_url = '/s/order-share.html?order=';
        if ( wl != 'tzyh365' ) {
            wl_url = '/' + wl + '/s/order-share.html?order=';
        }

        var link = Config.getAndroidSharePrefix() + wl_url + self.orderObject.ticket + '&symbol=' + self.orderObject.symbol + '&name=' + self.orderObject.symbolName + '&invite=' + Cookie.get('inviteCode') + '&nickname=我&cmd=' + self.orderObject.cmd; // 分享链接

        var l = 'invhero-android:shareOrder?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

        // 添加分享按钮
        $('#J_Success').append('<a class="dialog-btn share J_Share" href="' + l + '">' + btnDesc + '</a>');

        $('#J_Success .share').on('click', function() {
          var share;
          // if (myshow) {
          //   share = new Share({ ticket: self.order, type: 'order' });
          //   share && share.getInfo();
          // }
        });
      } else {
        $('.dialog-trade').css('height', '12rem');
      }

    }, function(data) {
      curEl.html('立即平仓');
    });
  },

  _initAttrs: function() {
    var doc = $(document);
    var params = new Uri().getParams();

    this.name = params.name;
    this.symbol = params.symbol;
    this.price = parseFloat(params.price);
    this.order = params.order;
    this.stoploss = params.stoploss;
    this.takeprofit = params.takeprofit;
    // 用了个临时方案处理没有unit的问题
    this.unit = params.unit || 2;

    this.setTitle(this.name);

    // 是否绘制开仓平仓价格线
    this.drawPriceLines = false;

  },

  _getNowDateFormate: function(now) {
    var date = now ? new Date(now) : new Date(Date.now() - 60 * 60 * 24 * 1000);
    var displayTime = date.Format("yyyy-MM-dd HH:mm:ss").substring(0, 10);

    return displayTime;
  },

  _getOrder: function(type) {
    var self = this;
    var data = {
      order: this.order
    };
    if (!this.isDemo()) {
      data.access_token = Cookie.get('token');
      type = 'real';
    } else {
      type = 'demo';
    }


    this.ajax({
      url: '/v1/order/' + this.order + '&access_token=' + Cookie.get('token'),
      data: data
    }).then(function(data) {

      var cmd = data.data.cmd,
        sta = data.data.status;
      self.open = sta == 'open';
      self.cmd = data.data.cmd;
      self.slippage = data.data.slippage;
      self.profit = data.data.profit;
      self.orderObject = data.data;
      self.unit = data.data.mini_quote_unit;
      self.render(orderTmpl, data.data, $('#J_Container'));
      self.guadan = sta == 'pending';


      //读到订单数据就先显示按钮, 之后再根据状态调整

      self.render(actionTmpl, {
        name: data.data.symbolName,
        symbol: data.data.symbol,
        order: data.data.ticket,
        cmd: data.data.cmd,
        type: type,
        status: data.data.status,
        // price: p,
        // start: data.start,
        stoploss: data.data.stopLoss,
        takeprofit: data.data.takeProfit,
        unit: data.data.min_quote_unit,
        ui: data.data.ui,
        ifAllowModify: getAllowModify()
      }, $('#footer'));

      // 添加分享按钮的
      // if (self.isWeixin()) {
      //   var doc = $(document);
      //   var share;

      //   var myshow = !self.isDemo() && !self.guadan && getUseNewShare();
      //   if (myshow) {
      //     // share = new Share({ ticket: self.order, type: 'order' });
      //   }

      //   var html = '<span class="option share J_HeadShare">分享</span>';
      //   $('#J_Header').append(html);
      //   $('.J_HeadShare').on('click', $.proxy(function() {
      //     $('#J_InfoImg').css('display', 'block');
      //     // !self.guadan && new Share({ ticket: self.order, type: 'order' });
      //     // share && share.getInfo();
      //   }, this));
      //   $('#J_InfoImg').on('click', $.proxy(function() {
      //     $('#J_InfoImg').css('display', 'none');
      //   }, this));

      // } else if (Config.isAndroidAPK()) {

      //   var nick = '我买';
      //   self.getAccount().then( function ( account ) {
      //     nick = account.nickname;
      //   } )

      //   var title = nick + (self.orderObject.cmd.indexOf('buy') != -1 ? '涨' : '跌') + self.orderObject.symbolName + ', 你怎么看?'; // 分享标题
      //   var desc = getWXCurrentDesWL();
      //   var imgUrl = getWXIconWL();

      //   var wlUrl = '/s/order-share.html?order=',wl = Cookie.get('wl');

      //   if (  wl != 'tzyh365' ) {
      //       wlUrl ='/' + wl + '/s/order-share.html?order=';
      //   }

      //   var link = Config.getAndroidSharePrefix() + wlUrl + self.orderObject.ticket + '&symbol=' + self.orderObject.symbol + '&name=' + self.orderObject.symbolName + '&invite=' + Cookie.get('inviteCode') + '&nickname=我&cmd=' + self.orderObject.cmd; // 分享链接

      //   var l = 'invhero-android:shareOrder?title=' + encodeURIComponent(title) + '&desc=' + encodeURIComponent(desc) + '&imgUrl=' + encodeURIComponent(imgUrl) + '&link=' + encodeURIComponent(link);

      //   // 添加分享按钮
      //   var html = '<a class="option share" href="' + l + '">分享</a>';
      //   $('#J_Header').append(html);

      //   $('#J_Header .share').on('click', function() {
      //     var share;
      //     if (!self.isDemo() && !self.guadan) {
      //       // share = new Share({ ticket: self.order, type: 'order' });
      //       // share && share.getInfo();
      //     }
      //   });
      // }

      var guadan = sta === 'pending' ? true : false;
      self.guadan = guadan;

      return self.ajax({
        url: '/v3/' + type + '/symbols6/',
        data: {
          symbols: self.symbol,
          access_token: Cookie.get('token')
        }
      }).then(function(data) {

        var symbolValue = data.data[0];
        try {
          self.minUnit = symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
        } catch (e) {
          self.minUnit = symbolValue.policy.min_quote_unit;
        }

        // self.unit = self.minUnit;

        var commission = parseFloat(self.orderObject.commission);

        self.getAccount().then(function(account) {
          self.account = account.account;
          if (!self.profileObject) {
            self.profileObject = new Object();
          }
          self.profileObject.avatar = account.avatar ? Config.getAvatarPrefix(account.avatar) : '';
          self.profileObject.nickname = account.nickname;
          if (self.isWeixin()) {
            // 获取到订单信息和Nickname之后调用
            self.setupWeiXinShare('order');
          }


          self.checkStatus(symbolValue, self.account).then(function(data) {
            data.accountType = type;

            var p = self.orderObject.openPrice;
            /*
            if (cmd.toLowerCase() == 'buy' || cmd.toLowerCase() == 'sell' ) {
                p = self.price;
            }
            else {
                p = self.orderObject.openPrice;
            }
            */

            //读到订单数据就先显示按钮, 之后再根据状态调整




            /*
            self.render(actionTmpl, {
              name: self.name,
              symbol: self.symbol,
              order: self.order,
              cmd: cmd,
              type: data.type,
              status: sta,
              price: p,
              start: data.start,
              stoploss: self.orderObject.stopLoss,
              takeprofit: self.orderObject.takeProfit,
              unit: symbolValue.policy.min_quote_unit,
              ui: self.orderObject.ui,
              ifAllowModify: getAllowModify()
            }, $('#footer'));
            */




            self.curState = '';

            // 如果是休市 无需刷新价格
            if (data.type === 'close') {

              $('#footer').empty().append('<div class="market-close"><p>' + (data.reason || '休市') + '</p><p class="desc">下次开始时间 ' + data.start + '</p></div>');
              // 减1天
              self.closeTime = Util.getTime(data.closeTime) - 60 * 60 * 24 * 1000;
              self._getData();
              self.curState = 'close';
            }

          });

          // 不是open订单就返回
          if (sta != 'open' || guadan) {
            return;
          }
          
          return self.getFloatingProfit(self.account, [data.data], [data.data.symbol]);
        }).then(function(floatProfit) {
          $('#J_FloatProfit').text(floatProfit.toFixed(2));
          $('#J_FloatProfitTrading').text((floatProfit + commission).toFixed(2));
        });

      });

    });
  },


  _initSticky: function() {
    // 导致浏览器crash
    $('#J_Sticky').sticky();
  },


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
      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      if (!self.account) {
        return;
      }

      var commission = parseFloat(self.orderObject.commission);

      // 更新浮动盈亏
      if (!self.guadan) {
        self.getFloatingProfit(self.account, [self.orderObject], [self.orderObject.symbol]).then(function(floatProfit) {
          $('#J_FloatProfit').text(floatProfit.toFixed(2));
          var swap = parseFloat(self.orderObject.swap) || 0;
          $('#J_FloatProfitTrading').text((floatProfit + commission - swap).toFixed(2));
        });
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
          // start_time: date
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

      if (self.chart && self.orderObject && !self.drawPriceLines) {
        self.drawPriceLines = true;
        self.chart.addPlotLine(self.orderObject.openPrice, 'open');
      }

      if (self.hasStatus()) {
        curPriceInfo && self.shouldChartUpdate(curPriceInfo);
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

      self.render(infoTmpl, curPriceInfo, infoEl);
      up ? infoEl.addClass('up') : infoEl.removeClass('up');

      self.priceInfo = curPriceInfo;

      if (self.chart) {
        self.chart.updatePlotLine(curPriceInfo.usePrice, up);
      }

      var lastData = self.lastData;
      var curPrice = parseFloat(curPriceInfo.usePrice);

      // time open high low close

      lastData[0] = Date.now();
      lastData[2] = lastData[2] < curPrice ? curPrice : lastData[2];
      lastData[3] = lastData[3] > curPrice ? curPrice : lastData[3];
      lastData[4] = curPrice;

      if (self.hasStatus()) {
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

  _getPrice: function() {
    var self = this;
    this.getCurrentPriceObject(this.symbol).then(function(price) {
      // 同时包含ask和bid
      self.askPrice = price.ask_price;
      self.bidPrice = price.bid_price;
      self.price = price.bid_price;
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
        self.startTime = Util.getTime(symbol[0].start);

        self.fire('receive:closeTime', {
          closeTime: self.startTime
        });
      }
    });
  },

  hasStatus: function() {
    return this.curState !== undefined && this.curState !== 'close';
  },

  _getCandle: function(type, refresh) {
    var self = this;

    if (type) {
      this.candleType = type;
    } else {
      type = this.candleType;
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
        //start_time: Util.formateTime((this.startTime || Date.now()) - (map[type] * 1000 * 50), "yyyy-MM-dd HH:mm:ss"),
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

      if (self.chart) {
        var chart = self.chartInstance;

        chart.series[0].setData(list);
        chart.hideLoading();
        self.chart.selectedIndex = indexMap[type];

        if (refresh && self.curState == 'close') {
          self.refresh = false;
          self._getData();
        }

        return;
      }

      // hide loding
      self._hideLoading();
      // create the chart
      self.chart = new Chart({
        data: list,
        price: self.price,
        up: false,
        stockName: self.name,
        selectedIndex: self.types.indexOf(type),
        height: '70%',
        xLabelShow: true
      });
      self.type = 'up';
      self.chartInstance = self.chart.getInstance();
    });
  },

  _initChart: function() {
    this._getCandle('m30');
  },

  _hideLoading: function() {
    $('#J_Loading').remove();
    $('#J_RangeContro').show();
  },

  _showLoad: function(curEl) {
    curEl.attr('data-name', curEl.text());
    curEl.html('<span class="loading-wrapper">处理中<span class="dialog-load"></span></span>');
  },

  attrs: {
    containerEl: $('#J_Container'),
    chartContainerE: $('#J_ChartWrapper'),


    delTmpl: [
      '<div class="dialog J_Dialog del-dialog " id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '        <p class="title">确认删除挂单？</p>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">取消</span>',
      '       <span class="dialog-btn J_DialogConfirm">删除</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),

    types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1']
  }
});

new Order();