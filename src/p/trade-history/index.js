"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var InfinityScroll = require('../../common/infinite-scroll/index');
var Cookie = require('../../lib/cookie');
var Login = require('../../common/login');
var Util = require('../../app/util');
var Sticky = require('../../common/sticky');
var CustomerService = require('../../common/customer-service');
var SildeMenu = require('../../common/slide-menu');
var listTmpl = require('./list.ejs');
var kindListTmpl = require('./kindList.ejs');
var timeListTmpl = require('./timeList.ejs');
var followListTmpl = require('./followList.ejs')
// var LiveSpeech = require('../../common/live-speech');


function TradeHistory() {
  TradeHistory.superclass.constructor.apply(this, arguments);
  var self = this;
  this.getToken().then(() => {
    if (self.cookie.get('goType')) {
      self.cookie.set('type', 'real');
    }
    return this.getAllSymbolsPrice().then(() => {
      self.init();
    });
  });
}

Base.extend(TradeHistory, PageBase, {
  init: function() {
    this._requires();
    this._bind();
    this._initSticky();
    this._getList();
    this._getTotal();
    this.configStatistics();
    this.prevType = this.isDemo();

    // new LiveSpeech();
  },

  _bind: function() {
    var doc = $(document);

    doc.on('tap', '.link', $.proxy(this._linkColl, this));
    doc.on('tap', '.J_Fn', $.proxy(this._fnListShow, this));
    doc.on('tap', '.getFollowList', $.proxy(this._getFollowList, this));
    doc.on('tap', '.getOrderList', $.proxy(this._removeList, this));

    doc.on('tap', (e) => {
      e.preventDefault();
      e.stopPropagation();
      var curEl = $(e.target);
      
      if (curEl.parents('.fn').length <= 0 && !curEl.hasClass('fn')) {
        this._fnListHide();
      }
    })
    // this.subscribe('get:orderList', this._getOrderList, this);
    // doc.on('tap', '.getKindList', $.proxy(this._getKindList, this));
    // doc.on('tap', '.getTimeList', $.proxy(this._getTimeList, this));
    // doc.on('tap', '.getOrderList', $.proxy(this._removeList, this));
    // $('#fnMask').on('click', _.bind(this._hideFn, this))
    //   .on('touchmove', (e) => {
    //     e.preventDefault();
    //     e.stopPropagation();
    //   });
    
    // this.subscribe('switch:account', function() {
    //     setTimeout(function() {
    //         location.reload();
    //     }, 0);
    // });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

    $(window).on('scroll', (e) => {
      var winHeight = $(window).height();
      var scrollTop = $(window).scrollTop();
      var listHeight = this._getContainer().height();
      if (winHeight + scrollTop > listHeight) {

        this._getList();

        if ($('#J_FnList').hasClass('Kind')) {
          this._getFollowcollList();
        }
      }
    });
  },

  _lazyBind: function() {
    this.bottomAccount.on('toggle:account', this._toggleAccount, this);
    this.bottomAccount.on('toggle:account:error', this._toggleAccountError, this);
  },

  _hideFn: function(e) {
    e.preventDefault();
    e.stopPropagation();
    return false;
  },

  _fnListShow: function() {
    var popupEl = $('#J_FnList');

    popupEl.show();

    setTimeout(() => {
      popupEl.addClass('show');
    }, 0)
  },

  _fnListHide: function() {
    var popupEl = $('#J_FnList');

    popupEl.removeClass('show');
    setTimeout(() => {
      popupEl.hide();
    }, 50);
  },

  _getKindList: function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.cancelBubble = true;
    $('#J_FnList').toggleClass('hide');
    //$('#fnMask').toggleClass('hide');
    var containerEl = this._getContainer();
    containerEl.removeClass('timeList');
    containerEl.removeClass('kindList');
    this._getOrderList();
    containerEl.addClass('kindList');
    return false;
  },
  _getTimeList: function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.cancelBubble = true;
    $('#J_FnList').toggleClass('hide');
    //$('#fnMask').toggleClass('hide');
    var containerEl = this._getContainer();
    containerEl.removeClass('timeList');
    containerEl.removeClass('kindList');
    this._getOrderList();
    containerEl.addClass('timeList');
    return false;
  },
  _getFollowList: function(e) {
    e.stopPropagation();
    e.preventDefault();
    e.cancelBubble = true;
    var curEl = $(e.target);

    if($('#J_FnList').hasClass('Kind')) {
      this._removeList();
      return;
    }

    $('#J_FnList').addClass('Kind');
    this._fnListHide();

    if ( curEl.children().length > 0 ) {
      curEl.children().text('取消分组');
    } else {
      curEl.text('取消分组');
    }
    
    var containerEl = this._getContainer();
    containerEl.removeClass('timeList');
    containerEl.removeClass('kindList');
    containerEl.addClass('followList');
    this._getFollowOrderList();
    return false;
  },
  _removeList: function(e) {
    window.location.reload();
    // e.stopPropagation();
    // e.preventDefault();
    // e.cancelBubble = true;
    // $('#J_FnList').addClass('hide').removeClass('Kind');
    // $('#fnMask').addClass('hide');
    // var containerEl = this._getContainer();
    // containerEl.removeClass('timeList');
    // containerEl.removeClass('kindList');
    // containerEl.removeClass('followList');
    // this._getOrderList();
    // return false;
  },

  _getList: function() {
    if (this.request || !this.hasNextPage) {
      return;
    }
    var type = this.isDemo() ? 'demo' : 'real';


    this.request = true;

    this.loaderEl.show();


    this.ajax({
      url: `/v1/orders/${type}/history/list`,
      data: {
        access_token: this.cookie.get('token'),
        real_token: this.cookie.get('real_token'),
        page_num: this.pageNum++
      }
    }).then((data) => {

      var list = data.data;

      if (list.length === 30) {
        this.hasNextPage = true;
      } else {
        this.hasNextPage = false;
      }

      if (list.length === 0 && this.pageNum !== 1) {
        return;
      }

      this._render(list);
      this.request = false;
    });
  },

  _getFollowcollList: function() {
    var type = this.isDemo() ? 'demo' : 'real';

    this.request = true;
    // this.loaderEl.show();
    if ( this.Followcoll || !this.hasCollNextPage ) {
      return;
    }
    this.Followcoll = true;
    this.ajax({
      url: `/v1/orders/${type}/history/mobtrade/list`,
      data: {
        access_token: this.cookie.get('token'),
        real_token: this.cookie.get('real_token'),
        page_num: ++this.pageCollNum,
        follow_id: this.expertId,
      }
    }).then((data) => {
      this.loaderEl.hide();
      var list = data.data;

      if (list.length === 30) {
        this.hasCollNextPage = true;
      } else {
        this.hasCollNextPage = false;
      }

      if (list.length === 0 && this.pageNum !== 1) {
        return;
      }
      this._renderColl(list);
      this.Followcoll = false;
    });
  },

  _render: function(list) {
    var containerEl = this._getContainer();
    this.renderTo(listTmpl, {
      list: list,
      showqr: getIfShowWXCodeWL(),
      qrcode: getNewGuideQRCode(),
      weixin: getWeiXinWL()
    }, containerEl);
    this.loaderEl.hide();
  },

  _renderColl: function(list) {
    var containerEl;
    var containerEls = $('.linkAll_detail');
    for ( var i = 0, len = containerEls.length; i < len; i++) {
      var item = $(containerEls[i]);
      var followId = item.attr('data-loffow-id');
      if (followId == this.expertId) {
        containerEl = item;
        break;
      }
    }
    if (!containerEl || list.length === 0) {
      return;
    }
    this.renderTo(listTmpl, {
      list: list,
      showqr: getIfShowWXCodeWL(),
      qrcode: getNewGuideQRCode(),
      weixin: getWeiXinWL()
    }, containerEl);
  },


  _getTotal: function() {
    var type = this.isDemo() ? 'demo' : 'real';


    this.ajax({
      url: `/v1/orders/${type}/history/summary`,
      data: {
        access_token: this.cookie.get('token'),
        real_token: this.cookie.get('real_token')
      }
    }).then((data) => {
      data = data.data && data.data[0];
      this.broadcast('get:orderHistoryDetail', {
        totalTrade: data.counts,
        total: data.allprofits || 0
      });
    });
  },

  _getOrderList: function() {
    if (this.request) {
      return;
    }

    this.request = true;
    var self = this;
    var containerEl = self._getContainer();
    if (!containerEl.hasClass('kindList') && !containerEl.hasClass('timeList')) {
      this.getHistoryOrderList().then(function(data) {
        var list = data.list;
        var containerEl = self._getContainer();


        if (containerEl.hasClass('kindList')) {
          var kindListData = self._kindList(list);
          self.render(kindListTmpl, {
            list: kindListData,
            showqr: getIfShowWXCodeWL(),
            qrcode: getNewGuideQRCode(),
            weixin: getWeiXinWL()
          }, containerEl);
          console.log(kindListData);
          if (list) {
            self._getCurPrice(list, containerEl);
          }
        } else if (containerEl.hasClass('timeList')) {
          var timeListData = self._timeList(list);
          self.render(timeListTmpl, {
            list: timeListData,
            showqr: getIfShowWXCodeWL(),
            qrcode: getNewGuideQRCode(),
            weixin: getWeiXinWL()
          }, containerEl);
        } else {
          self.render(listTmpl, {
            list: list,
            showqr: getIfShowWXCodeWL(),
            qrcode: getNewGuideQRCode(),
            weixin: getWeiXinWL()
          }, containerEl);
        }
        self._getCurPrice(list, containerEl);
        self.loaderEl.hide();

        self.getAccount().then(function(account) {
          self.getFloatingProfit(account.account, data.list, data.symbols).done(function(profit, floatMargin) {
            self._getFloatMargin(floatMargin, list);
          });
        });
      });
    }
  },
  _getFollowOrderList: function() {
    if (this.request) {
      return;
    }

    this.request = true;
    var self = this;
    this.getHistoryOrderCollList().then(function(data) {
      var list = data.data;
      var containerEl = self._getContainer();
      self.render(followListTmpl, {
        list: list,
        showqr: getIfShowWXCodeWL(),
        qrcode: getNewGuideQRCode(),
        weixin: getWeiXinWL()
      }, containerEl);
    })
  },
  _timeList: function(list) {
    var timeList = [];
    for (var i = 0; i < list.length; i++) {
      if (list[i].status === "rejected") {
        list[i].closeTime = list[i].openTime;
      }
      var flag = true;
      for (var j = 0; j < timeList.length; j++) {
        if (list[i].closeTime.substring(0, 7) === timeList[j].closeTime) {
          timeList[j].datas.push(list[i]);
          flag = false;
          break;
        }
      }
      if (flag) {
        timeList.push({
          closeTime: list[i].closeTime.substring(0, 7),
          datas: []
        });

        timeList[timeList.length - 1].datas.push(list[i]);
      }
    }
    if (timeList.length > 0) {
      this.balance = this.bottomAccount._getBalance();
      var timeListData = [],
        sumProfit = [],
        sumVolume = [];
      for (var m = 0; m < timeList.length; m++) {
        sumProfit[m] = 0;
        sumVolume[m] = 0;
        for (var k = 0; k < timeList[m].datas.length; k++) {
          sumVolume[m] += parseFloat(timeList[m].datas[k].volume);
          sumProfit[m] += parseFloat(timeList[m].datas[k].profit) - parseFloat(timeList[m].datas[k].commission) + parseFloat(timeList[m].datas[k].swap);
        }
      }
      timeListData.push({
        closeTime: timeList[0].closeTime,
        monthEndBalance: this.balance,
        sumProfit: sumProfit[0],
        monthStartBalance: this.balance - sumProfit[0],
        length: timeList[0].datas.length,
        sumVolume: sumVolume[0],
        datas: timeList[0].datas
      });
      if (timeList.length > 1) {
        for (var n = 1; n < timeList.length; n++) {
          timeListData.push({
            closeTime: timeList[n].closeTime,
            monthEndBalance: timeListData[n - 1].monthStartBalance,
            sumProfit: sumProfit[n],
            monthStartBalance: timeListData[n - 1].monthStartBalance - sumProfit[n],
            length: timeList[n].datas.length,
            sumVolume: sumVolume[n],
            datas: timeList[n].datas
          });
        }
      }

    }
    return timeListData;

  },
  _kindList: function(list) {
    var kindList = [];
    for (var i = 0; i < list.length; i++) {
      var flag = true;
      for (var j = 0; j < kindList.length; j++) {
        if (list[i].symbol === kindList[j].symbol) {
          if (list[i].cmd.substring(0, 3) === "buy") {
            kindList[j].buy.push(list[i]);
          } else {
            kindList[j].sell.push(list[i]);
          }
          flag = false;
          break;
        }
      }
      if (flag) {
        kindList.push({
          symbol: list[i].symbol,
          buy: [],
          sell: []
        });
        if (list[i].cmd.substring(0, 3) === "buy") {
          kindList[kindList.length - 1].buy.push(list[i]);
        } else {
          kindList[kindList.length - 1].sell.push(list[i]);
        }
      }
    }
    var kindListData = [];
    for (var k = 0; k < kindList.length; k++) {
      var buySumProfit = 0,
        sellSumProfit = 0,
        currentP = 0,
        buySum = 0,
        sellSum = 0,
        buySumVolume = 0,
        sellSumVolume = 0;
      for (var m = 0; m < kindList[k].buy.length; m++) {
        buySumProfit += parseFloat(kindList[k].buy[m].profit) + parseFloat(kindList[k].buy[m].swap) - parseFloat(kindList[k].buy[m].commission);
        buySum += (parseFloat(kindList[k].buy[m].openPrice) * parseFloat(kindList[k].buy[m].volume));
        buySumVolume += parseFloat(kindList[k].buy[m].volume);
      }
      if (kindList[k].buy.length)
        kindListData[kindListData.length] = {
          symbol: kindList[k].symbol,
          symbolName: kindList[k].buy[0].symbolName,
          cmd: "buy",
          sumProfit: buySumProfit,
          currentPrice: currentP,
          averagePrice: buySum / buySumVolume,
          length: kindList[k].buy.length,
          sumVolume: buySumVolume,
          datas: kindList[k].buy
        };
      for (var n = 0; n < kindList[k].sell.length; n++) {
        sellSumProfit += parseFloat(kindList[k].sell[n].profit) + parseFloat(kindList[k].sell[n].swap) - parseFloat(kindList[k].sell[n].commission);
        sellSum += (parseFloat(kindList[k].sell[n].openPrice) * parseFloat(kindList[k].sell[n].volume));
        sellSumVolume += parseFloat(kindList[k].sell[n].volume);
      }
      if (kindList[k].sell.length)
        kindListData[kindListData.length] = {
          symbol: kindList[k].symbol,
          symbolName: kindList[k].sell[0].symbolName,
          cmd: "sell",
          sumProfit: sellSumProfit,
          currentPrice: currentP,
          averagePrice: sellSum / sellSumVolume,
          length: kindList[k].sell.length,
          sumVolume: sellSumVolume,
          datas: kindList[k].sell
        };
    }
    return kindListData;
  },

  _getFloatMargin: function(floatMargin, orderList) {
    var listEl = this.isDemo() ? this.demoListEl : this.listEl;

    var total = 0; // 盈亏
    var totalTrade = orderList.length; // 交易次数


    if (floatMargin) {
      $.each(orderList, function(index, item) {
        total += parseFloat(item.profit) + parseFloat(item.swap) - parseFloat(item.commission);
      });
    }

    this.broadcast('get:orderHistoryDetail', {
      totalTrade: totalTrade,
      total: total
    });
  },

  _getContainer: function() {
    var isDemo = this.isDemo();
    var type = isDemo ? 'demo' : 'real';
    var containerEl = isDemo ? this.demoListEl : this.listEl;

    this['type-' + type] = true;

    this._toggle(isDemo);

    return containerEl;
  },

  _toggle: function(demo) {
    demo ? this.contentEl.removeClass('real') : this.contentEl.addClass('real');
  },

  _toggleAccount: function(data) {
    this._toggle(data.demo);
    // this.loaderEl.show();
    // this.pageNum = 0;

    if (this.prevType === data.demo) {
      return;
    }

    //尝试解决订单重复问题
    this.pageNum = 0;
    this.hasNextPage = true;
    this.prevType = this.isDemo();
    this._getTotal();
    this._getList();
  },

  _toggleAccountError: function() {
    this.loaderEl.hide();
    if (!this['type-demo']) {
      this.listEl.html('<li>您不能查看当前交易信息，请刷新页面重试</li>');
    }
  },

  _link: function(e) {
    var curEl = $(e.currentTarget),
      listDatas = [],
      index = parseInt(curEl[0].id.substr(8));

    if (curEl.hasClass('link_all')) {
      $('.triangleAll', curEl).toggleClass('triangleAllUp');
      if (curEl.hasClass('link_all_timeList')) {

        var self = this;
        this.getHistoryOrderList().then(function(data) {
          var list = data.list;
          var timeListData = self._timeList(list);
          if (curEl.siblings().length) {
            curEl.siblings().remove();
          } else {
            curEl.after('<div class="linkAll_detail"></div>')
            var containerEl = curEl.siblings();
            list = timeListData[index].datas;
            self.render(listTmpl, {
              list: list,
              showqr: getIfShowWXCodeWL(),
              qrcode: getNewGuideQRCode(),
              weixin: getWeiXinWL()
            }, containerEl);
            self._getCurPrice(list, containerEl);
            self.loaderEl.hide();
            self.getAccount().then(function(account) {
              self.getFloatingProfit(account.account, data.list, data.symbols).done(function(profit, floatMargin) {
                self._getFloatMargin(floatMargin, list);
              });
            });
          }
        });
      } else {
        var self = this;
        this.getHistoryOrderList().then(function(data) {
          var list = data.list;
          var kindListData = self._kindList(list);
          if (curEl.siblings().length) {
            curEl.siblings().remove();
          } else {
            curEl.after('<div class="linkAll_detail"></div>')
            var containerEl = curEl.siblings();
            list = kindListData[index].datas;
            self.render(listTmpl, {
              list: list,
              showqr: getIfShowWXCodeWL(),
              qrcode: getNewGuideQRCode(),
              weixin: getWeiXinWL()
            }, containerEl);
            self._getCurPrice(list, containerEl);
            self.loaderEl.hide();
            self.getAccount().then(function(account) {
              self.getFloatingProfit(account.account, data.list, data.symbols).done(function(profit, floatMargin) {
                self._getFloatMargin(floatMargin, list);
              });
            });
          }
        });
      }
    } else {
      var href = curEl.attr('href'),
        price = $('.J_Price', curEl).text();

      href += '&price=' + price;
      e.preventDefault();

      location.href = href;
    }
  },

  _linkColl: function(e) {
    var self = this;
    var curEl = $(e.currentTarget),
      parentEl = curEl.parents('.table'),
      expertId = curEl.attr('data-expertId'),
      desc = '您还没有自主交易订单';
      this.expertId = expertId;
      if(expertId != 0) {
        desc = '您还没有跟随订单';
      }

      $('.triangleAll', curEl).toggleClass('triangleAllUp');


      this.getHistoryOrderAloList(expertId).then(function(data) {
        var list = data.data;
        if (curEl.siblings().length) {
          curEl.siblings().remove();
          parentEl.siblings().show();
        } else {
          self.pageCollNum = 0;
          self.hasCollNextPage = true;
          parentEl.siblings().hide();
          curEl.after('<div class="linkAll_detail" data-loffow-id='+ expertId +'></div>');
          var containerEl = curEl.siblings();
          self.render(listTmpl, {
            list: list,
            showqr: getIfShowWXCodeWL(),
            qrcode: getNewGuideQRCode(),
            // desc: desc,
            weixin: getWeiXinWL()
          }, containerEl);
          self.loaderEl.hide();
        }
      });
  },

  _initSticky: function() {
    $('nav').sticky();
  },

  _getCurPrice: function(list, containerEl, type) {
    var symbols = [];

    $.each(list, function(index, item) {
      if (symbols.indexOf(item.symbol) === -1) {
        symbols.push(item.symbol);
      }
    });
    console.log(symbols);
    this.getCurrentPrice(symbols).then(function(data) {

      $.each(data, function(symbol, price) {
        var price = price;
        try {
          var priceEl = $('.J_Price[data-symbol=' + symbol + ']', containerEl);
        } catch (e) {
          var priceEl = $('.J_Price[data-symbolname=' + symbol.replace(/\./g, '--') + ']', containerEl);
        }

        priceEl.text(price);

        self.request = false;
      });
    });

    //this.getCurrentPrice(symbols).then(function(data) {
    // 历史订单不用更新价格
    /*
    $.each(data, function(symbol, price) {
        var price = price;
        $('.J_Price[data-symbol=' + symbol + ']', containerEl).text(price);
    });
    */
    //});
  },

  _setInterval: function() {
    var self = this,
      data = this.bottomAccount,
      type = data.isDemo() ? 'demo' : 'real',
      typeTag = 'init-' + type;

    if (data.orderList) {
      self.getFloatingProfit(data.account, data.orderList.list, data.orderList.symbols).done(function(profit, floatOption) {
        var equity = parseFloat(data.account[type].balance) + parseFloat(profit);
        var freeMargin = equity - parseFloat(data.orderList.margin);
        var margin = parseFloat(data.account[type].margin);
        var bait = parseFloat(data.account[type].bait ? data.account[type].bait : 0);
        var bonus = parseFloat(data.account[type].bonus ? data.account[type].bonus : 0);
       
        var rate;
        if (data.margin == 0) {
          rate = '--';
        }
        else if (bonus < margin) {
          rate = ((freeMargin + margin) / margin * 100).toFixed(2);
        }
        else if (bonus >= margin) {
          rate = ((freeMargin + margin * 2 - bonus)/margin * 100).toFixed(2);
        }
        
        var tmplData = {
          netDeposit: equity,
          freeMargin: freeMargin,
          profit: profit,
          rate: rate,
          type: type,
          edit: data.edit,
          init: data.hasInit
        };


        data[typeTag] = true;

        self.broadcast('get:accountData', tmplData);
      });
    }
    setTimeout(function() {
      self._setInterval();
    }, self.getIntervalTime());
  },
  _requires: function() {
    var self = this;
    // this.login = new Login();

    this.slideMenu = new SildeMenu({
      el: $('#J_SlideMenu'),
      page: 'history'
    }).on('get:bottomAccount', function(bottomAccount) {
      self.bottomAccount = bottomAccount;
      self._lazyBind(); 
      self._setInterval();
    });
    // new CustomerService();
  },

  attrs: {
    contentEl: $('#J_Content'),
    listEl: $('#J_List'),
    demoListEl: $('#J_DemoList'),
    loaderEl: $('#J_Loading'),
    emptyTmpl: '<li class="empty">你还没有交易信息</li>',
    request: false,
    pageNum: 0,
    hasNextPage: true
  }
});

new TradeHistory();
