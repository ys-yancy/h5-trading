"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');

var Chart = require('../../common/chart/index');
var Sticky = require('../../common/sticky');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Toast = require('../../common/toast');
var Dialog = require('../../common/dialog');
var CandleRefresh = require('../../common/candle-refresh');
var MarqueeTitle = require('../../common/marquee-title');
var Config = require('../../app/config');
var infoTmpl = require('./info.ejs');
var closeTmpl = require('./close.ejs');
var orderTmpl = require('./order.ejs');

function OrderShare() {
  OrderShare.superclass.constructor.apply(this, arguments);
  var self = this;

  if (!Cookie.get('token')) {
    this.isVisitor = true;
    if (window.location.href.indexOf('waibao') != -1 || window.location.href.indexOf('127.0.0.1') != -1 || window.location.href.indexOf('localhost') != -1) {
      Cookie.set('token', 'token4');
    } else {
      Cookie.set('token', '1b206283-5ab6-4849-b9e2-56e2cf607966', {
        expires: Config.getOrderShareAnonymousTokenExpireTime()
      });
    }
  }

  var params = new Uri().getParams();
  // 记录用户来源, 优先取微信的from, 其次是我们自己定的source
  this.source = params.from ? params.from : params.source;

  if (!Cookie.get('source') && this.source) {
    Cookie.set('source', this.source);
  }

  this.getToken('', true).then(function() {
    self.init();
  });
}

Base.extend(OrderShare, PageBase, {
  init: function() {
    this._initAttrs();
    this._bind();
    this._initDialog();
    this._initChart();
    this._initSticky();
    this._getData();
    this._getOrder();
    this._checkStatus();
    this.configStatistics();
  },

  mix: [CandleRefresh, MarqueeTitle],

  _bind: function() {
    var doc = $(document);

    doc.on('tap', '#J_Register .register', $.proxy(this._inviteRegister, this));
    doc.on('tap', '#J_Open .open', $.proxy(this._openOrder, this));
    /*
    doc.on('tap', '#J_Guess .support', $.proxy(this._support, this));
    doc.on('tap', '#J_Guess .oppose', $.proxy(this._oppose, this));
    */

  },

  _initDialog: function() {
    var self = this;

    this.phoneDialog = new Dialog({
      isShow: false,
      tmpl: this.tmpl,
      confirmCallback: function() {
        var el = self.phoneDialog.el,
          telEl = $('input', el),
          tel = telEl.val();

        if (!tel) {
          $('.message', el).html('手机号码不能为空!').show();
          return;
        } else {
          var parent = telEl.parent('.wrapper');
          var regPhone = /^(0|86|17951)?(13[0-9]|15[012356789]|18[0-9]|14[57]|17[0-9])[0-9]{8}$/;
          if (!regPhone.test(tel)) {
            $('.message', el).html('请输入正确的手机号').show();
            return;
          } else {
            $('.message', el).hide();
          }
        }
        // 获取到手机号, 可以提交了
        self._submit(tel);
        self.phoneDialog.hide();

        // 用户登录过, 才保存phone, 这里很可能有BUG
        if (self.cookie.get('token')) {
          self.cookie.set('phone', tel);
        }
      },

      cancleCallback: $.proxy(function() {
        new Toast('不输入手机号, 是不能竞猜的!');

        self.fire('cancle:login');
      }, this)
    });

  },

  _showError: function(curEl, message) {
    var parent = $(curEl.parents('li')[0]);
    var messageEl = curEl.siblings('.err');

    if (messageEl.length === 0) {
      curEl.after('<p class="err">' + message + '</p>');
    } else {
      messageEl.text(message);
      messageEl.show();
    }
    parent.addClass('error');
  },

  _hideError: function(wrapperEl) {
    wrapperEl.removeClass('error').addClass('success');

  },

  _submit: function(tel) {
    var self = this;

    // 提交竞猜
    this.ajax({
      url: '/v1/quiz/order/' + this.order,
      type: 'post',
      data: {
        cmd: self.guess,
        phone: tel,
        refer: self.invite,
        wl: getWXWL()
      }
    }).then(function(data) {
      data = data.data;
      // 新用户
      if (data.new) {
        new Toast('竞猜成功! 请关注官方微信tzyh365');
      } else {
        new Toast('竞猜成功!');
      }

      // 修改UI中的竞猜数字
      var n = 0;
      if (self.guess == 1) {
        n = parseInt($('#J_Guess .support .desc')[0].innerHTML.split(' ')[0]) + 1;
        $('#J_Guess .support .desc').text(n + ' 人');
      } else {
        n = parseInt($('#J_Guess .oppose .desc')[0].innerHTML.split(' ')[0]) + 1;
        $('#J_Guess .oppose .desc').text(n + '人');
      }
    });
  },

  _support: function(e) {
    this.guess = 1;
    var tel = this.cookie.get('phone');
    if (tel) {
      this._submit(tel);
    }
    // 需要登录
    else {
      this.phoneDialog.show();
    }
  },

  _oppose: function(e) {
    this.guess = -1;
    var tel = this.cookie.get('phone');
    if (tel) {
      this._submit(tel);
    }
    // 需要登录
    else {
      this.phoneDialog.show();
    }
  },

  _inviteRegister: function(e) {
    // 平仓订单, 邀请注册, 需要考虑白标客户
    // var wl = window.location.pathname.substring(0, window.location.pathname.indexOf('/s/'));
    // window.location = '../' + wl + '/i/' + this.invite;

    // 这里需要服务器帮忙实现跳转
    window.location = getWXInviteUrlWL() + this.invite; // window.location = '../i/' + this.invite;
  },

  _openOrder: function() {
    // 投资英豪用户
    if (!this.isVisitor) {
      var url;

      // 这里需要服务器帮忙实现跳转
      if (this.orderObject.cmd.indexOf('limit') != -1 || this.orderObject.cmd.indexOf('stop') != -1) {
        url = "./pro-trading.html?symbol=" + this.orderObject.symbol + "&cmd=" + this.orderObject.cmd + "&openprice=" + this.orderObject.openPrice;
      } else {
        url = "./pro-trading.html?symbol=" + this.orderObject.symbol;
      }

      //  记录跟随自哪个订单
      url += "&followFromTicket=" + this.orderObject.ticket + "&unit=" + this.orderObject.mini_quote_unit + "&name=" + encodeURIComponent(this.orderObject.symbolName) + "&stoploss=" + this.orderObject.stopLoss + "&takeprofit=" + this.orderObject.takeProfit + "&fullRouter=" + encodeURIComponent(location.href);
      window.location = url;

    }
    // 访客 or 没有登录过webapp的注册用户
    else {
      // 访客
      Cookie.expire('token');

      // 这里需要服务器帮忙实现跳转
      // window.location = '../i/' + this.invite;
      var l = getWXInviteUrlWL() + this.invite + '&order=' + this.orderObject.ticket + "&fromPage=order-share&source=orderShare";
      window.location = l;
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
    var params = new Uri().getParams();

    this.name = params.name;
    this.symbol = params.symbol;
    this.price = parseFloat(params.price);
    this.order = params.order ? params.order : params.ticket;
    this.invite = params.invite ? params.invite : params.refer;
    this.nickname = params.nickname;
    this.cmd = params.cmd;


    // 页面title: @nickname 买涨/买跌
    if (this.nickname && this.cmd) {
      document.title = '@' + this.nickname + (this.cmd.indexOf('buy') != -1 ? ' 买涨' : ' 买跌');
    }

    this.setTitle(this.name);

    // 是否绘制开仓平仓价格线
    this.drawPriceLines = false;
  },

  _checkStatus: function() {
    var self = this,
      type;

    if (!this.isDemo()) {
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

      try {
        self.minUnit = symbolValue.policy.min_quote_unit.split('.')[1].split('').length;
      } catch (e) {
        self.minUnit = symbolValue.policy.min_quote_unit;
      }

      self.checkStatus(symbolValue, self.account).then(function(data) {
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
      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      priceInfo && self.shouldChartUpdate(priceInfo);


      if (!self.account) {
        return;
      }

      // 更新浮动盈亏
      self.getFloatingProfit(self.account, [self.orderObject], [self.orderObject.symbol]).then(function(floatProfit) {
        $('#J_FloatProfit').text(floatProfit.toFixed(2) || 0);
      });

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

      var point = [
        Util.getTime(curPriceInfo.beijing_time),
        curPriceInfo.open,
        curPriceInfo.high,
        curPriceInfo.low,
        curPriceInfo.close
      ];

      curPriceInfo.usePrice = curPriceInfo.price; // = up ? curPriceInfo.askPrice : curPriceInfo.bidPrice;


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
      if (self.chart) {
        // 绘图使用对应cmd的平仓价格
        self.chart.updatePlotLine(curPriceInfo.usePrice, up);

        var lastData = self.lastData;
        // 绘图使用对应cmd的平仓价格
        var curPrice = parseFloat(curPriceInfo.usePrice);

        // time open high low close

        lastData[0] = Date.now();
        lastData[2] = lastData[2] < curPrice ? curPrice : lastData[2];
        lastData[3] = lastData[3] > curPrice ? curPrice : lastData[3];
        lastData[4] = curPrice;

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
    /*
    if (!this.isDemo()) {
        this.getRealToken().then(function(realToken) {
            data.real_token = realToken;
            self._requestOrder(data);
        });
    } else {
        this._requestOrder(data);
    }
    */
    // 分享页面不用区分模拟实盘
    this._requestOrder(data);
  },

  _requestOrder: function(data) {
    var self = this;

    this.ajax({
      url: '/v1/order/' + this.order,
      data: data
    }).then(function(data) {

      self.orderObject = data.data;

      console.log(data);

      self.unit = data.data.mini_quote_unit;

      // 增加微信分享
      if (self.isWeixin()) {
        var doc = $(document);

        var html = '<a class="option share">分享订单</a>';
        $('#J_Header').append(html);

        doc.on('tap', '#J_Header .share', $.proxy(function() {
          $('#J_InfoImg').css('display', 'block');
        }, this));

        doc.on('tap', '#J_InfoImg', $.proxy(function() {
          $('#J_InfoImg').css('display', 'none');
        }, this));
      }

      // 已平仓订单
      if (data.data.status == 'closed') {
        $('#J_Register').css('display', 'block');
        data.data.profitInAll = parseFloat(data.data.profit) + parseFloat(data.data.swap) - parseFloat(data.data.commission);
        data.data.ror = (data.data.profitInAll / parseFloat(data.data.margin)).toFixed(4) * 100;
        self.render(closeTmpl, data.data, $('#J_Container'));

        if (self.isWeixin()) {
          self.setupWeiXinShare('history');
        }
      }
      // 开仓或挂单
      else if (data.data.status == 'open' || data.data.status == 'pending') {
        // 我也要下单
        $('#J_Open').css('display', 'block');
        self.render(orderTmpl, data.data, $('#J_Container'));

        if (self.isWeixin()) {
          self.setupWeiXinShare('order');
        }


        /*
        // 猜别人订单盈利亏损
        $('#J_Guess').css('display', 'block');
        self.render(orderTmpl, data.data, $('#J_Container'));


        self.ajax({
            url: '/v1/quiz/stats/order/' + self.order,
        }).then(function(data) {
            console.log(data);
            var guess = data.data;
            for (var i = 0; i < guess.length; i ++) {
                // 支持的人数
                if (guess[i].cmd == 1) {
                    guess[i].total += 2;
                    $('#J_Guess .support .desc').text(guess[i].total + ' 人');
                }
                // 否定的人数
                else {
                    guess[i].total += 1;
                    $('#J_Guess .oppose .desc').text(guess[i].total + '人');
                }
            }

        });
        */

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

        chart.series

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
    types: ['m1', 'm5', 'm15', 'm30', 'h1', 'd1'],

    tmpl: [
      '<div class="dialog J_Dialog password-dialog" id="J_Dialog">',
      '   <span class="wrapper-icon"><span class="icon"></span></span>',
      '   <div class="dialog-content J_Content">',
      '       <p class="title">你还不是投资英豪用户, 需要',
      '       <p class="title">登记手机号方可获得竞猜奖金!</p>',
      '       <div class="input-wrapper">',
      '           <input type="text" placeholder="请输入手机号码">',
      '           <p class="message">手机号码不能为空</p>',
      '       </div>',
      '   </div>',
      '   <div class="dialog-buttons clearfix">',
      '       <span class="dialog-btn J_DialogClose">不猜了</span>',
      '       <span class="dialog-btn J_DialogConfirm">登记</span>',
      '   </div>',
      '</div>',
      '<div class="dialog-mask J_DialogMask"></div>'
    ].join(''),
  }
});

new OrderShare();