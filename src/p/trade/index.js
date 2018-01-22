"use strict";

var Base = require('../../app/base');
var PageBase = require('../../app/page-base');
var Util = require('../../app/util');
var Config = require('../../app/config');
var Sticky = require('../../common/sticky');
var Cookie = require('../../lib/cookie');
var Login = require('../../common/login');
var SildeMenu = require('../../common/slide-menu');
var Check = require('../../common/check');
var BottomNav = require('../../common/bottom-nav');
var listTmpl = require('./list.ejs');
var kindListTmpl = require('./kindList.ejs');
var listTmpl2 = require('./list2.ejs');
var gendanListTmpl = require('./gendanList.ejs');

const Sound = require('../../common/sound');

// var CustomerService = require('../../common/customer-service');
// var TopMsg = require('../../common/top-msg');

// var LiveSpeech = require('../../common/live-speech');


function Trade() {
  Trade.superclass.constructor.apply(this, arguments);
  var self = this;

  this.getToken().then(() => {
    new BottomNav({
      page: 'option'
    });
    
    if (self.cookie.get('goType')) {
      self.cookie.set('type', 'real');
    }

    this.getAllSymbolsPrice().then(() => {
      self.init();

      new Check({ page: 'trade' });
      new Sound();
    });


    // new TopMsg($.merge({
    //     el: $('header')
    // }, Config.getBroadcastConfig('trade')));
  });
}

Base.extend(Trade, PageBase, {
  init: function() {
    this._requires();
    this._bind();
    this._initSticky();
    this.configStatistics();
    this.kindListData = {};
    this.list = {};
    // new LiveSpeech();
  },

  _bind: function() {
    var doc = $(document);
    
    this.subscribe('get:orderList', this._getOrderList, this);
    this.subscribe('remove:ticket', this.remove, this);

    doc.on('tap', '.link', $.proxy(this._link, this));
    doc.on('tap', '.J_Fn', $.proxy(this._fnListShow, this));
    doc.on('tap', '.getKindList', $.proxy(this._getKindList, this));

    $('#fnMask').on('click', _.bind(this._hideFn, this))
      .on('touchmove', (e) => {
        e.preventDefault();
        e.stopPropagation();
      });

    // this.subscribe('switch:account', function() {
    //   setTimeout(function() {
    //     location.reload();
    //   }, 0);
    // });

    // 添加默认微信分享
    if (this.isWeixin()) {
      this.setupWeiXinShare('default_invite');
    }

  },

  _lazyBind: function() {
    this.bottomAccount.on('get:realFloatMargin', this._getFloatMargin, this);
    this.bottomAccount.on('toggle:account', this._toggleAccount, this);
    this.bottomAccount.on('toggle:account:error', this._toggleAccountError, this);
  },

  _hideFn: function(e) {
    e.preventDefault();
    e.stopPropagation();
    //e.bubbles = false;
    return false;
  },

  _fnListShow: function() {
    $('#J_FnList').toggleClass('hide');
    if ($('#J_FnList').hasClass('hide')) {
      $('#history_trade').attr('href', './trade-history.html');
    } else {
      $('#history_trade').attr('href', 'javascript:;');
    }
  },

  _getKindList: function(e) {
    e.stopPropagation();
    e.preventDefault();
    //e.bubbles = false;
    e.cancelBubble = true;
    var containerEl = this._getContainer();
    if (containerEl.hasClass('kindList')) {
      window.location.reload();
    } else {
      $('.getKindList a').html('取消分组&nbsp;');
      this._getKindListData();
      containerEl.addClass('kindList');
    }
    $('#J_FnList').toggleClass('hide');

    if ($('#J_FnList').hasClass('hide')) {
      setTimeout(function() {
        $('#history_trade').attr('href', './trade-history.html');
      }, 1000);
    } else {
      $('#history_trade').attr('href', 'javascript:;');
    }
    return false;
  },

  _getOrderList: function(data) {
    var list = data ? data.list : null;
    this.list = data;
    this.cacheList = list;
    this.kindListData = this._kindList(list);
    var containerEl = this._getContainer();

    var curFollowId;
    var gendanObj = {};
    var gendanList = [];
    var guadanList = [];
    var normalList = [];

    if (list) {
      for (var i = 0, len = list.length; i < len; i++) {
        var item = list[i];

        if (item.follow) {
          var expert_id = item.expert_id;
          if ( gendanObj[expert_id] ) {
            gendanObj[expert_id].push(item);
          } else {
            gendanObj[expert_id] = [];
            gendanObj[expert_id].push({
              isTitle: true, 
              followName: item.follow_name, 
              followNum: item.follow_num,
              expert_id: expert_id
            });
            gendanObj[expert_id].push(item);
          }

          gendanList.push(item);

        } else {
          if (item.status === 'pending') {
            guadanList.push(item);
          } else {
            normalList.push(item);
          }
        }
      }
    }

    if (!containerEl.hasClass('kindList')) {
      this.render(listTmpl, {
        normal: normalList,
        guadan: guadanList,
        gendanlength: gendanList.length,
        showqr: getIfShowWXCodeWL(),
        qrcode: getNewGuideQRCode(),
        weixin: getWeiXinWL()
      }, containerEl);

      this.renderTo(gendanListTmpl, {
        gendanObj: gendanObj
      }, containerEl);

    }

    if (list) {
      this._getCurPrice(list, containerEl);
    }
    this.loaderEl.hide();
  },
  _getKindListData: function() {
    var kindListData = this.kindListData;
    var containerEl = this._getContainer();
    this.render(kindListTmpl, {
      list: kindListData,
      showqr: getIfShowWXCodeWL(),
      qrcode: getNewGuideQRCode(),
      weixin: getWeiXinWL()
    }, containerEl);
    this.loaderEl.hide();
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

  remove: function(e) {
    var ticket = e.ticket;
    (this.cacheList || []).forEach((item, index) => {
      if (item.ticket == ticket) {
        this.cacheList.splice(index, 1);
      }
    });

    this._getOrderList(this.cacheList);

    // 尝试在这里更新 bottomAccount
    this.broadcast('update:account', {
      fresh: true
    });
  },

  _getFloatMargin: function(floatMargin) {
    var listEl = this.isDemo() ? this.demoListEl : this.listEl;

    $('.J_Formate.no-guadan', listEl).each(function(index, item) {
      item = $(item);
      var order = item.attr('data-order');

      try {
        item.text(floatMargin[order].toFixed(2));
        if (floatMargin[order] >= 0) {
          item.addClass('up');
          item.removeClass('down');
        } else {
          item.addClass('down');
          item.removeClass('up');
        }
      } catch (e) {
        item.text(floatMargin[order]);
      }
    });

    // this._getFollowOrderFloatMarginList();

  },

  // _getFollowOrderFloatMarginList: function() {
  //   var listEl = this.isDemo() ? this.demoListEl : this.listEl;
  //   var gendanTitleEls = $('.J_AllProfit', listEl);

  //   gendanTitleEls.each((index, item) => {
  //     item = $(item);
  //     var orderId = item.attr('data-id'),
  //         formateEls = $('.J_Profit'),
  //         allProfit = 0;

  //     formateEls.each((index, el) => {
  //       el = $(el);
  //       var dataId = el.attr('data-id');
  //       if ( dataId && orderId == dataId ) {
  //         var profit = el.text();
  //         profit = parseFloat(profit);
  //         allProfit += profit;
  //       }
  //     })

  //     allProfit = allProfit.toFixed(2);

  //     item.text(allProfit);
  //     if (allProfit > 0) {
  //       item.addClass('up').removeClass('down');
  //     } else {
  //       item.removeClass('up').addClass('down');
  //     }

  //   })
  // },

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
  },

  _toggleAccountError: function() {
    this.loaderEl.hide();
    if (!this['type-demo']) {
      this.listEl.html('<li>您不能查看当前交易信息，请刷新页面重试</li>');
    }
  },

  _link: function(e) {
    var curEl = $(e.currentTarget),
      href = curEl.attr('href'),
      price = $('.J_Price', curEl).text(),
      index = parseInt(curEl[0].id.substr(8));
    if (curEl.hasClass('link_all')) {
      $('.triangleAll', curEl).toggleClass('triangleAllUp');

      var self = this;

      if (curEl.siblings().length) {
        curEl.siblings().remove();
      } else {
        curEl.after('<div class="linkAll_detail"></div>')
        var containerEl = curEl.siblings();
        var list = this.kindListData[index].datas;
        self.render(listTmpl2, {
          list: list,
          showqr: getIfShowWXCodeWL(),
          qrcode: getNewGuideQRCode(),
          weixin: getWeiXinWL()
        }, containerEl);
      }
    } else {
      href += '&price=' + price;
      e.preventDefault();

      location.href = href;
    }
  },

  _getCurPrice: function(list, containerEl, type) {
    var symbols = [];

    $.each(list, function(index, item) {
      if (symbols.indexOf(item.symbol) === -1) {
        symbols.push(item.symbol);
      }
    });

    this.getCurrentPrice(symbols).then(function(data) {

      $.each(data, function(symbol, price) {

        var price = price;
        try {
          var priceEl = $('.J_Price[data-symbol=' + symbol + ']', containerEl);
        } catch (e) {
          var priceEl = $('.J_Price[data-symbolname=' + symbol.replace(/\./g, '--') + ']', containerEl);
        }

        priceEl.text(price);
      });
    });
  },

  _setInterval: function() {
    var self = this,
      data = this.bottomAccount || this.cookie.get('type'),
      type = data.isDemo() ? 'demo' : 'real',
      typeTag = 'init-' + type;

    if (data.orderList) {
      self.getFloatingProfit(data.account, data.orderList.list, data.orderList.symbols).done(function(profit, floatOption, prices) {
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

        data._toggleAccount();


        self.bottomAccount.fire('get:realFloatMargin', floatOption);
  
        // 更新所有当前订单的当前价格
        var containerEl = self._getContainer();
        if (!prices) {
          return;
        }
        for (var i = 0, l = prices.length; i < l; i++) {
          var price = prices[i];
          var symbol = price.symbol;
          try {
            var priceEls = $('.J_Price[data-symbol=' + symbol + ']');

            // var linkPriceEls = $('.name[link-symbol=' + symbol + ']');

            // var linkChildEls = $('.J_Formate[linkchild-symbol=' + symbol + ']');
          } catch (e) {
            var priceEls = $('.J_Price[data-symbolname=' + symbol.replace(/\./g, '--') + ']');

            // var linkPriceEls = $('.name[link-symbol=' + symbol.replace(/\./g, '--') + ']');

            // var linkChildEls = $('.J_Formate[linkchild-symbol=' + symbol.replace(/\./g, '--') + ']');
          }


          $.each(priceEls, function(index, item) {
            item = $(item);
            try {
              var curprice = price.ask_price[0];
              if (item.attr('data-cmd') == 'up') {
                // 挂单订单显示开仓要用的价格
                if (item.attr('data-status') == 'pending') {
                  curprice = price.ask_price[0];
                }
                // 开仓订单显示平仓要用的价格
                else {
                  curprice = price.bid_price[0];
                }
              } else {
                // 挂单订单显示开仓要用的价格
                if (item.attr('data-status') == 'pending') {
                  curprice = price.bid_price[0];
                }
                // 开仓订单显示平仓要用的价格
                else {
                  curprice = price.ask_price[0];
                }
              }

              item.text(curprice);
            } catch (e) {
              console.log(e);
            }
          });

          //临时解决汇总订单数据不刷新问题
          // if (linkPriceEls && linkPriceEls.length && linkChildEls && linkChildEls.length) {
          //   var linkPriceElsVal = 0;
          //   try{
          //     for ( var j = 0; j < linkChildEls.length; j++ ) {
          //       var hm = $(linkChildEls[j]).text();
          //       linkPriceElsVal += parseFloat(hm);
          //     }
          //     linkPriceEls.html(linkPriceElsVal.toFixed(2));
          //   }catch(e) {

          //   }
            
          // };

        }

      });
    }
    setTimeout(function() {
      self._setInterval();
    }, self.getIntervalTime());
  },

  _initSticky: function() {
    $('nav').sticky();
  },

  _requires: function() {
    var self = this;
    this.login = new Login();
    this.slideMenu = new SildeMenu({
      el: $('#J_SlideMenu'),
      page: 'trade',
      noInterval: true
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
    emptyTmpl: '<li class="empty">你还没有交易信息</li>'
  }
});

new Trade();
