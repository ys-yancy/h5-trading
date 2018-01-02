'use strict';

var PageBase = require('../../app/page-base');
var Uri = require('../../app/uri');
var Util = require('../../app/util');
var Config = require('../../app/config');
var Chart = require('./chart');
var CandleRefresh = require('../../common/candle-refresh');
var Progress = require('../../lib/progress');
var orderTmpl = require('./index.ejs');
var closeTmpl = require('./close.ejs');
var Header = require('../../common/header');
var Core = require('../my/common/core');
var symbol = require('../../app/symbol');
var session = require('../../app/session');
require('../my/common/header');

class ShareOrder extends PageBase {
  constructor() {
    super();

    new Header();


    // 获取连接中的邀请码
    var params = new Uri().getParams();
    var inviteCode = params.invite;
    var uid = params.uid;
    if (inviteCode) {
      inviteCode = inviteCode.substr(0, 6);
    }

    this.core = new Core({ inviteCode: params.invite, token: this.cookie.get('token') });

    // 转发人的邀请码, 如果有转发人, 那么久使用转发人的邀请码去跳转登录页
    this.repostInviteCode = params.repostInviteCode;
    if (this.repostInviteCode) {
      this.repostInviteCode = this.repostInviteCode.substr(0, 6);
    }

    // 匿名用户 (尚未注册的用户)
    if (!this.cookie.get('token')) {
      this.anony = true;

      var herfUrl = getWXInviteUrlWL() + (this.repostInviteCode ? this.repostInviteCode : inviteCode) + '&source=shareOrder';
      if ( getIsNewShareWl() ) {
        herfUrl = getNewShareWl() + uid;
      }
      // 邀请注册的链接白标化
      $('.bottom .link').attr('href', herfUrl).text('马上注册 跟投赚钱');
      this._init();
    } else {
      this.anony = false;
      this._init();
    }

  }

  _init() {
    this._initAttrs();
    this._bind();
    this.core.getOrderInfo().then(() => {
      this._getData();
      this._getOrder();
    });

    this._userInfo();
    this.configStatistics();
  }



  _bind() {
    var doc = $(document);
    doc.on('tap', '.tab-nav', $.proxy(this._switch, this));
  }

  _switch(e) {
    var curEl = $(e.currentTarget);
    var index = curEl.index();
    var tabContentEls = $('.tab-content');
    var tabNavContainerEls = $('.tab-nav');

    if (index === 0) {
      $(tabNavContainerEls[0]).addClass('active');
      $(tabNavContainerEls[1]).removeClass('active');
      $(tabContentEls[0]).show();
      $(tabContentEls[1]).hide();
    } else {
      $(tabNavContainerEls[0]).removeClass('active');
      $(tabNavContainerEls[1]).addClass('active');
      $(tabContentEls[0]).hide();
      $(tabContentEls[1]).show();
    }
  }

  _userInfo() {

    this.ajax({
      url: '/v1/user/profile/info',
      data: {
        invite_code: this.inviteCode,
        access_token: this.cookie.get('token') || ''
      }
    }).then((data) => {
      data = data.data;

      $('#J_Name').text(data.nick_name);

      var avatar;
      if (data.avatar) {
        avatar = Config.getAvatarPrefix(data.avatar);

      } else {
        avatar = getDefaultIconWL();
      }
      $('#J_Img').attr('src', avatar);
      if (data.month_rate_of_return === undefined && data.gross_profit === undefined) {
        $('#J_BtData').hide()
        $('.J_ProfitNum').hide().siblings('.title').append('<p style="color:#01BDF1">Ta不想让别人看到</p>');
      }
      $('.J_ProfitNum').text(parseInt(data.month_rate_of_return * 100) + '%');
    })
  }

  _getOrder() {

    var self = this;

    this.ajax({
      url: '/v1/order/' + this.order,
      data: {
        access_token: this.cookie.get('token') || '',
        _r: Math.random()
      }
    }).then((data) => {
      data = data.data;

      self.orderObject = data;

      this.takeProfit = parseFloat(data.takeProfit);
      this.stopLoss = parseFloat(data.stopLoss);
      self.unit = data.mini_quote_unit;
      this.margin = data.margin;
      self._setInterval();

      // 已平仓订单
      if (data.status == 'closed') {
        var time = Util.getTime(data.closeTime) - Util.getTime(data.openTime);
        var day = parseInt(time / (24 * 1000 * 60 * 60));
        var hour = parseInt((time - day * (24 * 1000 * 60 * 60)) / (60 * 1000 * 60));

        data.day = day;
        data.hour = hour;

        data.profitInAll = (parseFloat(data.profit) + parseFloat(data.swap ? data.swap : 0) - parseFloat(data.commission ? data.commission : 0)).toFixed(2);

        self.render(closeTmpl, data, $('#container-hd'));

        var circle = new Progress.Circle('#J_CircleProgress', {
          color: '#01bdf1',
          strokeWidth: 3,
          trailWidth: 1,
          trailColor: '#5d6692',
          stroke: '#01bdf1',
          text: {
            value: '0%'
          },
          step: function(state, bar) {
            bar.setText((bar.value() * 200).toFixed(2) + '%');
          }
        });

        if (data.profit > 0) {
          var per = data.profit / data.margin * .5;
          circle.animate(per);
        }

        // circle.animate(0.7)


        if (self.isWeixin()) {
          var doc = $(document);

          self.profileObject = data;
          // 当前访问页面的用户的inviteCode, 为销售准备
          self.profileObject.repostInviteCode = self.cookie.get('inviteCode');
          // 当前订单所有人的邀请码
          self.profileObject.inviteCode = self.inviteCode;

          var html = '<a class="ui common icon share"></a>';
          $('#J_Header').append(html);

          doc.on('tap', '#J_Header .share', $.proxy(function() {
            $('#J_InfoImg').css('display', 'block');
          }, this));

          doc.on('tap', '#J_InfoImg', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
          }, this));

          self.ajax({
            url: '/v1/user/profile/info',
            data: {
              invite_code: self.inviteCode,
              access_token: self.cookie.get('token')
            }
          }).then((data) => {
            data = data.data;

            if (!self.profileObject) {
              self.profileObject = new Object();
            }
            self.profileObject.avatar = data.avatar ? Config.getAvatarPrefix(data.avatar) : '';
            self.profileObject.nickname = data.nick_name;

            self.setupWeiXinShare('history');
          });

        }
      }
      // 开仓或挂单
      else if (data.status == 'open' || data.status == 'pending') {
        // 我也要下单
        // $('#J_Open').css('display', 'block');
        self.render(orderTmpl, data, $('#container-hd'));

        if (self.isWeixin()) {
          var doc = $(document);

          self.profileObject = data;
          // 当前访问页面的用户的inviteCode, 为销售准备
          self.profileObject.repostInviteCode = self.cookie.get('inviteCode');
          // 当前订单所有人的邀请码
          self.profileObject.inviteCode = self.inviteCode;

          var html = '<a class="option share ui icon"></a>';
          $('#J_Header').append(html);

          doc.on('tap', '#J_Header .share', $.proxy(function() {
            $('#J_InfoImg').css('display', 'block');
          }, this));

          doc.on('tap', '#J_InfoImg', $.proxy(function() {
            $('#J_InfoImg').css('display', 'none');
          }, this));

          self.ajax({
            url: '/v1/user/profile/info',
            data: {
              invite_code: self.inviteCode,
              access_token: self.cookie.get('token')
            }
          }).then((data) => {
            data = data.data;

            if (!self.profileObject) {
              self.profileObject = new Object();
            }
            self.profileObject.avatar = data.avatar ? Config.getAvatarPrefix(data.avatar) : '';
            self.profileObject.nickname = data.nick_name;

            self.setupWeiXinShare('order');
          });
        }

        this._getProfit();
      }

      setTimeout(() => {
        if (this.orderObject.status !== 'pending') {
          // $('.margin-progress').css({
          //   width: '50%'
          // });
        }

      }, 300);

      $('.J_OpenPrice').text(data.openPrice);
      $('.J_OpenPrice').parent().addClass('show');
      var unit;
      if (data.mini_quote_unit.length == 1) {
        unit = 1;
      } else {
        unit = data.mini_quote_unit.split('.')[1].length;
      }

      unit = 1;

      if (this.stopLoss) {

        $('.J_StopLoss').text((unit > 1 ? this.stopLoss.toFixed(unit) : this.stopLoss));
        $('.J_StopLoss').parent().addClass('show');
      }

      if (this.takeProfit) {
        $('.J_Profit').text((unit > 1 ? this.takeProfit.toFixed(unit) : this.takeProfit));
        $('.J_Profit').parent().addClass('show');
      }

      if (this.stopLoss && !this.takeProfit) {
        $('.stopLoss-wrapper').addClass('single');
        $('.profit-wrapper').hide();
      }

      if (!this.stopLoss && this.takeProfit) {
        $('.profit-wrapper').addClass('single');
        $('.stoploss-wrapper').hide();
      }
      var unit
      try {
        unit = self.unit.split('.')[1].length
      } catch (e) {
        unit = self.unit;
      }

      this.chart = new Chart({
        symbol: this.symbol,
        unit: unit,
        openPrice: data.openPrice,
        stopLoss: this.stopLoss,
        takeProfit: this.takeProfit
      });

      //用户看到的内容
      if (!self.anony) {
        var url;

        // 这里需要服务器帮忙实现跳转
        if (self.orderObject.cmd.indexOf('limit') != -1 || self.orderObject.cmd.indexOf('stop') != -1) {
          url = "./pro-trading.html?symbol=" + self.orderObject.symbol + "&cmd=" + self.orderObject.cmd + "&openprice=" + self.orderObject.openPrice;
        } else {
          url = "./pro-trading.html?symbol=" + self.orderObject.symbol + "&cmd=" + self.orderObject.cmd;
        }

        //  记录跟随自哪个订单
        url += "&followFromTicket=" + self.orderObject.ticket + "&unit=" + self.orderObject.mini_quote_unit + "&name=" + encodeURIComponent(self.orderObject.symbolName) + "&stoploss=" + self.orderObject.stopLoss + "&takeprofit=" + self.orderObject.takeProfit + "&fullRouter=" + encodeURIComponent(location.href);
        $('.link').attr('href', url);
      }

      if (data.status === 'closed') {
        if (!self.anony) {

          var inv = new Uri().getParams().invite;

          // var desc = inv ? '查看投资人信息' : '查看更多订单';
          var desc = inv ? '查看投资人信息' : '马上跟投';



          if (inv) {
            $('.link').attr('href', './my/profile.html?inviteCode=' + inv + '&from=' + encodeURIComponent(location.href));
          } else {
            // $('.link').attr('href', './my/sort-latest.html?from=' + encodeURIComponent(location.href));
            var url = "./pro-trading.html?symbol=" + self.orderObject.symbol + "&unit=" + self.orderObject.mini_quote_unit + "&name=" + encodeURIComponent(self.orderObject.symbolName) + "&fullRouter=" + encodeURIComponent(location.href);
            $('.link').attr('href', url);
          }
          $('.link').text(desc);
        }
      }
    });
  }

  _takeProfit(volume) {
    this._getSymbol().then((symbolValue) => {
      return this.calMoney(session.get('group'), symbolValue, parseFloat(this.orderObject.volume), this.orderObject.openPrice, this.stopLoss, this.takeProfit).then((price) => {
        // var fixed = Math.round(1 / self.symbolValue.policy.min_quote_unit).toString().length - 1;
        // 目标和止损金额是2位小数
        var fixed = 2;

        var profit = price.takeProfit.toFixed(fixed),
          loss = price.stopLoss.toFixed(fixed);

        if (!isNaN(profit)) {
          $('.J_ProfitCount').text(profit);
          var desc = this.anony ? '注册跟投 ' : '马上跟投 ';
          if (parseFloat(price.takeProfit) == 0 && this.orderObject.status !== 'closed') {} else {
            desc += '有机会盈利 $' + (profit / volume).toFixed(0) + '/手';

          }
          $('.link').text(desc);

          var per = profit < 0 ? 0 : (profit / (2 * this.margin));
          per = per >= 2 ? 1 : per;

          // $('.profit-margin').css({
          //   width: per * 100 + '%'
          // });
        }
      });
    }).fail(function() {});
  }

  _getSymbol(type) {
    return symbol.get([this.symbol]).then((data) => {
      // consol/e.log(data);
      return data[0];
    });
  }


  _getProfit() {
    var orderObject = this.orderObject;
    

    return this.getFloatingProfit(session.get('group'), [this.orderObject], [this.orderObject.symbol]).then((floatProfit) => {

      var per = floatProfit < 0 ? 0 : (floatProfit / (2 * this.margin));
      per = per >= 2 ? 2 : per;

      // $('.float-profit').css({
      //   width: per * 100 + '%'
      // })

      $('.J_FloatProfit').text(floatProfit.toFixed(2))
        // console.log(floatProfit);

      return this._takeProfit(orderObject.volume);
    });

  }

  _setInterval() {
    var self = this;

    this._getCurPrice(true).then(function(curPriceInfo) {


      setTimeout(function() {
        self._setInterval();
      }, self.getIntervalTime());
    });
  }

  // 实时刷新价格
  _getCurPrice(interval) {
    var self = this,
      router = this.router,
      type = this.isDemo() ? 'demo' : 'real';

    return this.getCurrentPrice(this.symbol, true).then((priceInfo) => {
      self.price = priceInfo.price;
      self.askPrice = priceInfo.ask_price[0];
      self.bidPrice = priceInfo.bid_price[0];

      priceInfo && self.chart && self.chart.shouldChartUpdate(priceInfo);

      $('.J_CurPrice').text(self.price);
      $('.J_CurPrice').parent().addClass('show');


      if (!session.get('group') && self.orderObject.symbol) {
        return;
      }

      // this._getProfit();

      // 更新浮动盈亏session.get('group'), [this.orderObject], [this.orderObject.symbol]
      self.getFloatingProfit(session.get('group'), [self.orderObject], [self.orderObject.symbol]).then((floatProfit) => {
        var floatProfitEl = $('.J_FloatProfit.num');
        floatProfitEl.text(floatProfit.toFixed(2));

        if (floatProfit.toFixed(2) > 0) {
          floatProfitEl.addClass('up').removeClass('down');
        } else if(floatProfit.toFixed(2) < 0){
          floatProfitEl.addClass('down').removeClass('up');
        }

        var per = floatProfit < 0 ? 0 : (floatProfit / (2 * this.margin));
        per = per > 2 ? 2 : per;

        // $('.float-profit').css({
        //   width: per * 100 + '%'
        // });
      });

      if (self._getCacheCurPrice()) {
        return self.cacheCurPrice;
      }

      return self._getData(interval);
    });
  }

  _getCacheCurPrice() {
    return this.cacheCurPrice;
  }

  _setCacheCurPrice(price) {
    var self = this;
    clearTimeout(this.cachePriceTimer);

    this.cacheCurPrice = price;

    this.cachePriceTimer = setTimeout(function() {
      self.cacheCurPrice = null;
    }, self.getCandleExpireTime());

  }

  _getData(interval) {
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
    }).then((data) => {
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
      // var infoEl = $('#J_Info');

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

        self.orderObject && self._setInterval();
      }
    });
  }

  _getNowDateFormate(now) {
    var date = now ? new Date(now) : new Date(Date.now() - 60 * 60 * 24 * 1000);
    var displayTime = date.Format("yyyy-MM-dd HH:mm:ss").substring(0, 10);

    return displayTime;
  }

  _initAttrs() {
    var params = new Uri().getParams();

    this.unit = params.unit;
    this.symbol = params.symbol;
    this.name = params.name;
    this.order = params.order ? params.order : params.ticket;
    this.invite = params.invite ? params.invite : params.refer;
    this.nickname = params.nickname;
    this.cmd = params.cmd;
    this.uid = params.uid;
    this.inviteCode = params.invite;

    var linkEl = $('#J_ProfileLink');
    var goBackEl = $('#go-back');

    if (params.from) {
      goBackEl.attr('href', params.from);
    } else {
      goBackEl.remove();
    }

    if (!this.inviteCode) {
      return;
    }

    linkEl.attr('href', './my/profile.html?inviteCode=' + this.inviteCode + '&uid=' + this.uid + '&from=' + encodeURIComponent(location.href));
  }

}

new ShareOrder();